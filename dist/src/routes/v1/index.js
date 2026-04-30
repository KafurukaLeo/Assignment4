import express from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import listingsRoutes from "./listings.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import uploadRoutes from "./upload.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import morgan from "morgan";
const v1Router = express.Router();
// morgan logging
v1Router.use(process.env["NODE_ENV"] === "production"
    ? morgan("combined")
    : morgan("dev"));
v1Router.use("/auth", authRoutes);
v1Router.use("/users", usersRoutes);
v1Router.use("/listings", listingsRoutes);
v1Router.use("/bookings", bookingsRoutes);
v1Router.use("/reviews", reviewsRoutes);
v1Router.use("/upload", uploadRoutes);
// catch-all 404
v1Router.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
// error handler middleware
v1Router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong" });
});
export default v1Router;
//# sourceMappingURL=index.js.map