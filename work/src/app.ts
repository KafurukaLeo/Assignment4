import express from 'express';
import "dotenv/config";
import type { Request, Response } from "express";

// Create a basic Express app instance
// Note: This file is a lightweight version used for testing purposes.
// The main production app is configured in src/index.ts
const app = express();

// Parse incoming JSON request bodies
app.use(express.json());

// Test route — used to verify the server is running
app.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ message: "Test route works" });
});

// Health check route — returns server uptime and current timestamp
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(), 
    timestamp: new Date() 
  });
});

export default app;
