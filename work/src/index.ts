import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import morgan from "morgan";
import { connectDB } from "./config/prisma";
import { connectRedis } from "./config/redis";
import { setupSwagger } from "./config/swagger";
import { generalLimiter, strictLimiter } from "./middlewares/rateLimiter";
import { v1Router } from "./routes/v1/index";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

// Parse incoming JSON request bodies — must be before any routes
app.use(express.json());

// Trust the first proxy (required for express-rate-limit to work correctly on Render/Heroku)
// Without this, X-Forwarded-For header causes rate limiter to throw errors
app.set("trust proxy", 1);

// Compress all HTTP responses to reduce bandwidth usage
app.use(compression());

// Log HTTP requests — "combined" format in production, "dev" (colored) in development
app.use(morgan(process.env["NODE_ENV"] === "production" ? "combined" : "dev"));

// Apply general rate limiter to all routes (100 requests per 15 minutes)
app.use(generalLimiter);

// Apply strict rate limiter only to POST requests (20 requests per 15 minutes)
// This protects login, register, and other write endpoints from abuse
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST") return strictLimiter(req, res, next);
  next();
});

// Health check endpoint — used by deployment platforms to verify the server is alive
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

// Set up Swagger UI at /api-docs and ReDoc at /api-redoc
setupSwagger(app);

// Mount all v1 API routes under /api/v1
app.use("/api/v1", v1Router);

// Root endpoint — returns API info and links to documentation
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Airbnb API",
    version: "v1",
    docs: "/api-docs",
    redoc: "/api-redoc",
    health: "/health",
    api: "/api/v1",
  });
});

// 404 handler — catches any request that didn't match a route above
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler — catches errors thrown by controllers and middleware
app.use(errorHandler);

// Main function — connects to DB and Redis before starting the server
async function main() {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Only start the server if this file is run directly (not imported in tests)
if (require.main === module) {
  main();
}

export default app;
