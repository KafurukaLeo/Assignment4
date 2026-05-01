import express from 'express';
import "dotenv/config";
import type { Request, Response } from "express";

const app = express();

app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ message: "Test route works" });
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(), 
    timestamp: new Date() 
  });
});

export default app;
