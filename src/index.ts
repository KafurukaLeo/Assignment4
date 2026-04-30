import "dotenv/config";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import type { Request, Response, NextFunction } from "express";
import prisma from "./config/prisma.js";
import { setupSwagger } from "./config/swagger.js";
import { apiLimiter } from "./middlewares/rateLimiters.js";
import v1Router from "./routes/v1/index.js";

const app = express();
const PORT = process.env["PORT"] || 5000;

// compression middleware
app.use(compression());

// morgan logging
app.use(
  process.env["NODE_ENV"] === "production"
    ? morgan("combined")
    : morgan("dev")
);

// body parser middleware
app.use(express.json());

// general rate limiter
app.use(apiLimiter);

// swagger docs
setupSwagger(app);

// mount v1 router
app.use("/api/v1", v1Router);

// health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// catch-all 404 — must be last
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// error handler middleware (must be last)
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong" });
  }
);

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

main();

export default app;
