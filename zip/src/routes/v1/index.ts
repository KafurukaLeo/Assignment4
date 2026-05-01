import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import listingsRoutes from "./listings.routes";
import bookingsRoutes from "./bookings.routes";
import reviewsRoutes from "./reviews.routes";
import statsRoutes from "./stats.routes";
import uploadRoutes from "./upload.routes";
import { deprecatev1 } from "../../middlewares/deprecation.middleware";

export const v1Router = Router();

v1Router.use(deprecatev1);

v1Router.use("/auth", authRoutes);
v1Router.use("/users", usersRoutes);
v1Router.use("/listings", listingsRoutes);
v1Router.use("/bookings", bookingsRoutes);
v1Router.use("/reviews", reviewsRoutes);
v1Router.use("/upload", uploadRoutes);
v1Router.use("/stats", statsRoutes);

export default v1Router;
