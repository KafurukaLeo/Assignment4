import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import listingsRoutes from "./listings.routes";
import bookingsRoutes from "./bookings.routes";
import reviewsRoutes from "./reviews.routes";
import statsRoutes from "./stats.routes";
import uploadRoutes from "./upload.routes";
import { deprecatev1 } from "../../middlewares/deprecation.middleware";
import aiRoutes from "./ai.routes";

// Create the v1 router — all routes here are prefixed with /api/v1 (set in index.ts)
export const v1Router = Router();

// Add deprecation headers to every v1 response
// This tells API clients that v1 is deprecated and v2 is coming
v1Router.use(deprecatev1);

// Mount each feature's routes under its own path
v1Router.use("/auth", authRoutes);         // POST /api/v1/auth/login, /register, etc.
v1Router.use("/users", usersRoutes);       // GET/POST/PUT/DELETE /api/v1/users
v1Router.use("/listings", listingsRoutes); // GET/POST/PUT/DELETE /api/v1/listings
v1Router.use("/bookings", bookingsRoutes); // GET/POST/DELETE /api/v1/bookings
v1Router.use("/reviews", reviewsRoutes);   // GET/POST/PUT/DELETE /api/v1/reviews
v1Router.use("/upload", uploadRoutes);     // POST /api/v1/upload/avatar/:id
v1Router.use("/stats", statsRoutes);       // GET /api/v1/stats
v1Router.use("/ai", aiRoutes);             // POST /api/v1/ai/search, /recommend, etc.

export default v1Router;
