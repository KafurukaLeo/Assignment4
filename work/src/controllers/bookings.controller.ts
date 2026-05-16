import { type Request, type Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail, newBookingRequestEmail } from "../templates/email";
import { formatListing } from "../utils/listing";
import { createNotification } from "./notifications.controller";

/**
 * GET /api/v1/bookings
 * Returns all bookings with pagination.
 * - Includes guest (id, name, email) and listing (id, title, location) details
 * - Supports page and limit query params (default: page=1, limit=10)
 */
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const mode = req.query["mode"] as string;
    const status = req.query["status"] as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Role-based filtering
    if (req.role !== "admin") {
      if (mode === "host") {
        // Host mode: show bookings for listings owned by the host
        where.listing = { hostId: req.userId };
      } else {
        // Default/Guest mode: show bookings made by the user
        where.guestId = req.userId;
      }
    } else if (mode === "host") {
      // Admin can also view in host mode if they want, but usually they see all
      // For now, let's allow admin to filter by host if they provide a hostId
      const hostId = req.query["hostId"] as string;
      if (hostId) where.listing = { hostId };
    }

    // Handle tab filtering from frontend
    const today = new Date();
    if (status === "upcoming") {
      where.checkOut = { gte: today };
      where.status = { not: "cancelled" };
    } else if (status === "past") {
      where.checkOut = { lt: today };
      where.status = { not: "cancelled" };
    } else if (status === "cancelled") {
      where.status = "cancelled";
    }

    // Run count and fetch in parallel for better performance
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          guest: { select: { id: true, name: true, email: true } },
          listing: { 
            select: { 
              id: true, 
              title: true, 
              location: true, 
              photos: true, 
              pricePerNight: true,
              host: { select: { id: true, name: true, email: true } }
            } 
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ 
      data: bookings.map(b => ({ ...b, listing: formatListing(b.listing) })), 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching bookings" });
  }
};

/**
 * GET /api/v1/bookings/:id
 * Returns a single booking by its ID.
 * - Includes full guest and listing details
 * - Returns 404 if booking doesn't exist
 */
export const getBookingById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { guest: true, listing: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ ...booking, listing: formatListing(booking.listing) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching booking" });
  }
};

/**
 * GET /api/v1/bookings/user/:id
 * Returns all bookings for a specific user with pagination.
 * - Returns 404 if the user doesn't exist
 * - Includes listing details for each booking
 */
export const getUserBookings = async (req: Request, res: Response) => {
  const guestId = req.params["id"] as string;

  try {
    // Verify the user exists before fetching their bookings
    const user = await prisma.user.findUnique({ where: { id: guestId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { guestId },
        skip,
        take: limit,
        include: { listing: true },
      }),
      prisma.booking.count({ where: { guestId } }),
    ]);

    res.json({ 
      data: bookings.map(b => ({ ...b, listing: formatListing(b.listing) })), 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching user bookings" });
  }
};

/**
 * POST /api/v1/bookings
 * Creates a new booking for a listing.
 * - Requires authentication (guest must be logged in)
 * - Validates dates: checkIn must be before checkOut and in the future
 * - Calculates total price based on number of nights × price per night
 * - Uses a database transaction to prevent double-booking (race condition safe)
 * - Returns 409 if the listing is already booked for those dates
 * - Sends a booking confirmation email after successful creation (non-blocking)
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  const { listingId, checkIn, checkOut } = req.body as {
    listingId?: string;
    checkIn?: string;
    checkOut?: string;
  };

  if (!listingId || !checkIn || !checkOut) {
    return res.status(400).json({ error: "listingId, checkIn, and checkOut are required" });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Validate that the provided dates are valid date strings
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  if (checkInDate >= checkOutDate) {
    return res.status(400).json({ error: "checkIn must be before checkOut" });
  }

  if (checkInDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    return res.status(400).json({ error: "checkIn must be today or in the future" });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Calculate total price: number of nights × price per night
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = nights * listing.pricePerNight;
    const serviceFee = Math.round(subtotal * 0.1);
    const totalPrice = subtotal + serviceFee;
    const guestId = req.userId!;

    // Use a transaction to atomically check for conflicts and create the booking
    // This prevents two users from booking the same listing at the same time
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          listingId,
          status: "confirmed",
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (conflict) throw new Error("BOOKING_CONFLICT");

      return tx.booking.create({
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          status: "pending",
          guestId,
          listingId,
        },
        include: { guest: true, listing: true },
      });
    });

    // Notify Host of new booking
    await createNotification(
      listing.hostId,
      "New Booking Request",
      `You have a new booking request for ${listing.title} from ${booking.guest.name}`,
      "booking",
      "/dashboard/bookings"
    );

    res.status(201).json({ ...booking, listing: formatListing(booking.listing) });

    // Send confirmation email after responding — failure here doesn't affect the booking
    try {
      const guest = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (guest) {
        await sendEmail({
          to: guest.email,
          subject: "Booking Confirmation",
          html: bookingConfirmationEmail(
            guest.name,
            listing.title,
            listing.location,
            checkInDate.toDateString(),
            checkOutDate.toDateString(),
            totalPrice,
          ),
        });
      }
    } catch (emailErr) {
      console.error("Booking confirmation email failed:", emailErr);
    }

    // Send email to Host (best-effort)
    try {
      const host = await prisma.user.findUnique({ where: { id: listing.hostId } });
      if (host) {
        await sendEmail({
          to: host.email,
          subject: "New Booking Request Received",
          html: newBookingRequestEmail(
            host.name,
            booking.guest.name,
            listing.title,
            checkInDate.toDateString(),
            checkOutDate.toDateString(),
          ),
        });
      }
    } catch (hostEmailErr) {
      console.error("Host booking notification email failed:", hostEmailErr);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_CONFLICT") {
      return res.status(409).json({ error: "Listing is already booked for those dates" });
    }
    console.error(error);
    res.status(500).json({ error: "Error creating booking" });
  }
};

/**
 * DELETE /api/v1/bookings/:id
 * Cancels a booking (sets status to "cancelled").
 * - Requires authentication
 * - Only the guest who made the booking or an admin can cancel it
 * - Returns 400 if the booking is already cancelled
 * - Sends a cancellation email after successful cancellation (non-blocking)
 */
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  const id = req.params["id"] as string;
  const { reason } = req.body as { reason?: string };

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Permission Check: ONLY the host or an admin can cancel a booking
    if (booking.listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Soft delete — update status to "cancelled" instead of deleting the record
    const updated = await (prisma.booking as any).update({
      where: { id },
      data: { status: "cancelled", cancellationReason: reason || null },
    });

    // Notify the other party
    const isGuestCancelling = booking.guestId === req.userId;
    const recipientId = isGuestCancelling ? booking.listing.hostId : booking.guestId;
    const actorName = isGuestCancelling ? "Guest" : "Admin";

    await createNotification(
      recipientId,
      "Booking Cancelled",
      `The booking for ${booking.listing.title} has been cancelled by the ${actorName}.`,
      "booking",
      isGuestCancelling ? "/dashboard/bookings" : "/bookings"
    );

    res.json({ 
      message: "Booking cancelled successfully", 
      data: { ...updated, listing: formatListing(booking.listing) } 
    });

    // Send cancellation email after responding — failure here doesn't affect the cancellation
    try {
      const guest = await prisma.user.findUnique({ where: { id: booking.guestId } });
      if (guest) {
        await sendEmail({
          to: guest.email,
          subject: "Booking Cancellation",
          html: bookingCancellationEmail(
            guest.name,
            booking.listing.title,
            booking.checkIn.toDateString(),
            booking.checkOut.toDateString(),
            reason
          ),
        });
      }
    } catch (emailErr) {
      console.error("Cancellation email failed:", emailErr);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cancelling booking" });
  }
};

/**
 * PATCH /api/v1/bookings/:id/status
 * Updates the status of a booking (admin use).
 * - Valid statuses: "pending", "confirmed", "cancelled"
 * - Returns 400 if status is missing or invalid
 * - Returns 404 if booking doesn't exist
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const id = req.params["id"] as string;
  const { status, reason } = req.body as { status?: string; reason?: string };

  if (!status) return res.status(400).json({ error: "Status is required" });

  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const booking = await prisma.booking.findUnique({ 
      where: { id },
      include: { listing: true }
    });
    
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Permission Check: ONLY the host or an admin can update status or cancel
    if (booking.listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can update the booking status" });
    }

    const updated = await (prisma.booking as any).update({
      where: { id },
      data: { 
        status: status as "pending" | "confirmed" | "cancelled",
        cancellationReason: status === "cancelled" ? (reason || null) : null
      },
      include: { guest: true, listing: true },
    });

    res.json({ message: "Booking status updated successfully", data: { ...updated, listing: formatListing(updated.listing) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating booking status" });
  }
};

/**
 * PATCH /api/v1/bookings/:id/accept
 * FR-033/034: Host accepts a pending booking request.
 * - Fails if booking is older than 24 hours.
 */
export const acceptBooking = async (req: AuthRequest, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true, guest: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can accept this booking" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be accepted" });
    }

    // FR-034: Auto-expiry after 24 hours
    const hoursSinceCreation = (Date.now() - booking.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      await (prisma.booking as any).update({ 
        where: { id }, 
        data: { 
          status: "cancelled",
          cancellationReason: "Booking request expired (older than 24 hours)"
        } 
      });
      return res.status(400).json({ error: "Booking request has expired (older than 24 hours) and is now cancelled" });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "confirmed" },
      include: { guest: true, listing: true },
    });

    // Notify Guest
    await createNotification(
      booking.guestId,
      "Booking Accepted",
      `Your booking for ${booking.listing.title} has been accepted by the host!`,
      "booking",
      "/dashboard/bookings"
    );

    // Notify guest (best-effort)
    sendEmail({
      to: booking.guest.email,
      subject: "Booking Request Accepted",
      html: bookingConfirmationEmail(
        booking.guest.name,
        booking.listing.title,
        booking.listing.location,
        booking.checkIn.toDateString(),
        booking.checkOut.toDateString(),
        booking.totalPrice
      ),
    }).catch(console.error);

    res.json({ message: "Booking accepted successfully", data: { ...updated, listing: formatListing(updated.listing) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error accepting booking" });
  }
};

/**
 * PATCH /api/v1/bookings/:id/decline
 * FR-033/034: Host declines a pending booking request.
 */
export const declineBooking = async (req: AuthRequest, res: Response) => {
  const id = req.params["id"] as string;
  const { reason } = req.body as { reason?: string };

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true, guest: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can decline this booking" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be declined" });
    }

    const updated = await (prisma.booking as any).update({
      where: { id },
      data: { status: "cancelled", cancellationReason: reason || null }, // Map declined to cancelled for simplicity
      include: { guest: true, listing: true },
    });

    // Notify Guest
    await createNotification(
      booking.guestId,
      "Booking Declined",
      `Your booking request for ${booking.listing.title} was declined.`,
      "booking",
      "/dashboard/bookings"
    );

    // Notify guest (best-effort)
    sendEmail({
      to: booking.guest.email,
      subject: "Booking Request Declined",
      html: bookingCancellationEmail(
        booking.guest.name,
        booking.listing.title,
        booking.checkIn.toDateString(),
        booking.checkOut.toDateString(),
        reason
      ),
    }).catch(console.error);

    res.json({ message: "Booking declined successfully", data: { ...updated, listing: formatListing(updated.listing) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error declining booking" });
  }
};

/**
 * PATCH /api/v1/bookings/:id/dates
 * FR-039: Modify booking dates.
 * - Changes checkIn and checkOut, subject to host approval (resets status to pending).
 */
export const modifyBookingDates = async (req: AuthRequest, res: Response) => {
  const id = req.params["id"] as string;
  const { checkIn, checkOut } = req.body as { checkIn?: string; checkOut?: string };

  if (!checkIn || !checkOut) return res.status(400).json({ error: "checkIn and checkOut are required" });

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
    return res.status(400).json({ error: "Invalid dates" });
  }

  if (checkInDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    return res.status(400).json({ error: "checkIn must be today or in the future" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.guestId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the guest who made the booking can modify it" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Cannot modify a cancelled booking" });
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = nights * booking.listing.pricePerNight;
    const serviceFee = Math.round(subtotal * 0.1);
    const totalPrice = subtotal + serviceFee;

    const updated = await prisma.$transaction(async (tx) => {
      // Check for conflicts excluding the current booking
      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: id },
          listingId: booking.listingId,
          status: { in: ["confirmed", "pending"] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      // Also check blocked dates
      const blockedConflict = await tx.blocked_date.findFirst({
        where: {
          listingId: booking.listingId,
          startDate: { lt: checkOutDate },
          endDate: { gt: checkInDate },
        },
      });

      if (conflict || blockedConflict) throw new Error("BOOKING_CONFLICT");

      return tx.booking.update({
        where: { id },
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          status: "pending", // Modification requires host re-approval
        },
        include: { guest: true, listing: true },
      });
    });

    // Notify Host of modification
    await createNotification(
      booking.listing.hostId,
      "Booking Modified",
      `A guest has modified their booking dates for ${booking.listing.title} and is awaiting your approval.`,
      "booking",
      "/dashboard/bookings"
    );

    // Send email to Host (best-effort)
    try {
      const host = await prisma.user.findUnique({ where: { id: booking.listing.hostId } });
      if (host) {
        await sendEmail({
          to: host.email,
          subject: "Booking Dates Modified",
          html: newBookingRequestEmail(
            host.name,
            updated.guest.name,
            booking.listing.title,
            checkInDate.toDateString(),
            checkOutDate.toDateString(),
          ),
        });
      }
    } catch (hostEmailErr) {
      console.error("Host modification notification email failed:", hostEmailErr);
    }

    res.json({ message: "Booking dates modified and pending host approval", data: { ...updated, listing: formatListing(updated.listing) } });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_CONFLICT") {
      return res.status(409).json({ error: "Listing is already booked or blocked for those dates" });
    }
    console.error(error);
    res.status(500).json({ error: "Error modifying booking dates" });
  }
};
