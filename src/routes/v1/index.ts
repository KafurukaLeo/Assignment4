import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import listingsRoutes from "./listings.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import uploadRoutes from "./upload.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import morgan from "morgan";

const v1Router = express.Router();

// morgan logging
v1Router.use(
  process.env["NODE_ENV"] === "production"
    ? morgan("combined")
    : morgan("dev")
);

v1Router.use("/auth", authRoutes);
v1Router.use("/users", usersRoutes);
v1Router.use("/listings", listingsRoutes);
v1Router.use("/bookings", bookingsRoutes);
v1Router.use("/reviews", reviewsRoutes);
v1Router.use("/upload", uploadRoutes);

export default v1Router;
