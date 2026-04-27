import { type Request, type Response } from "express";
import prisma from "../config/prisma.js";

// GET all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guestById: true,
        listing: true,
      },
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// GET booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guestById: true,
        listing: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching booking" });
  }
};

// GET bookings by user ID (guest)
export const getUserBookings = async (req: Request, res: Response) => {
  const guestId = Number(req.params.guestId);

  if (isNaN(guestId)) {
    return res.status(400).json({ message: "Invalid guest ID" });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { guestId },
      include: {
        guestById: true,
        listing: true,
      },
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching user bookings" });
  }
};

// GET bookings by listing ID
export const getListingBookings = async (req: Request, res: Response) => {
  const listingId = Number(req.params.listingId);

  if (isNaN(listingId)) {
    return res.status(400).json({ message: "Invalid listing ID" });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { listingId },
      include: {
        guestById: true,
        listing: true,
      },
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this listing" });
    }

    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching listing bookings" });
  }
};

// POST create new booking
export const createBooking = async (req: Request, res: Response) => {
  const { checkIn, totalPrice, status, guestId, listingId } = req.body;

  // Validation
  if (!checkIn || !totalPrice || !status || !guestId || !listingId) {
    return res.status(400).json({
      message: "checkIn, totalPrice, status, guestId, and listingId are required",
    });
  }

  if (typeof totalPrice !== "number" || totalPrice <= 0) {
    return res.status(400).json({ message: "totalPrice must be a positive number" });
  };

  if (isNaN(Number(guestId)) || isNaN(Number(listingId))) {
    return res.status(400).json({ message: "Invalid guestId or listingId" });
  }

  try {
    // Check if guest exists
    const guest = await prisma.user.findUnique({
      where: { id: Number(guestId) },
    });

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: Number(listingId) },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Create booking
    const newBooking = await prisma.booking.create({
      data: {
        checkIn: new Date(checkIn),
        totalPrice,
        status,
        guestId: Number(guestId),
        listingId: Number(listingId),
      },
      include: {
        guestById: true,
        listing: true,
      },
    });

    res.status(201).json({
      message: "Booking created successfully",
      data: newBooking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// PUT update booking
export const updateBooking = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { checkIn, totalPrice, status } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  try {
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate data if provided
    if (totalPrice !== undefined && (typeof totalPrice !== "number" || totalPrice <= 0)) {
      return res.status(400).json({ message: "totalPrice must be a positive number" });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(totalPrice && { totalPrice }),
        ...(status && { status }),
      },
      include: {
        guestById: true,
        listing: true,
      },
    });

    res.json({
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating booking" });
  }
};

// DELETE booking
export const deleteBooking = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  try {
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Delete booking
    const deletedBooking = await prisma.booking.delete({
      where: { id },
    });

    res.json({
      message: "Booking deleted successfully",
      data: deletedBooking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting booking" });
  }
};

// PATCH update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  if (!status || typeof status !== "string") {
    return res.status(400).json({ message: "Status is required and must be a string" });
  }

  try {
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        guestById: true,
        listing: true,
      },
    });

    res.json({
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating booking status" });
  }
};
