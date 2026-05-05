import { type Request, type Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/email";

/**
 * GET /api/v1/bookings
 * Returns all bookings with pagination.
 * - Includes guest (id, name, email) and listing (id, title, location) details
 * - Supports page and limit query params (default: page=1, limit=10)
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    // Run count and fetch in parallel for better performance
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: limit,
        include: {
          guest: { select: { id: true, name: true, email: true } },
          listing: { select: { id: true, title: true, location: true } },
        },
      }),
      prisma.booking.count(),
    ]);

    res.json({ data: bookings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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
    res.json(booking);
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

    res.json({ data: bookings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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

  if (checkInDate <= new Date()) {
    return res.status(400).json({ error: "checkIn must be in the future" });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Calculate total price: number of nights × price per night
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.pricePerNight;
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

    res.status(201).json(booking);

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

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Only the booking owner or an admin can cancel
    if (booking.guestId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "You can only cancel your own bookings" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Soft delete — update status to "cancelled" instead of deleting the record
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json({ message: "Booking cancelled successfully", data: updated });

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
export const updateBookingStatus = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { status } = req.body as { status?: string };

  if (!status) return res.status(400).json({ error: "Status is required" });

  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as "pending" | "confirmed" | "cancelled" },
      include: { guest: true, listing: true },
    });

    res.json({ message: "Booking status updated successfully", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating booking status" });
  }
};
