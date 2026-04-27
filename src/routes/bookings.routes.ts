import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  getUserBookings,
  getListingBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
} from "../controllers/bookings.controller.js";

const router = Router();

// GET routes
router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.get("/user/:guestId", getUserBookings);
router.get("/listing/:listingId", getListingBookings);

// POST route
router.post("/", createBooking);

// PUT route
router.put("/:id", updateBooking);

// PATCH route
router.patch("/:id/status", updateBookingStatus);

// DELETE route
router.delete("/:id", deleteBooking);

export default router;
