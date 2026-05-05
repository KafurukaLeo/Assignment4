import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include userId and role
// These are set by the authenticate middleware after verifying the JWT token
export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

const JWT_SECRET = process.env["JWT_SECRET"] as string;

/**
 * authenticate middleware
 * Verifies the Bearer token from the Authorization header.
 * - Returns 401 if no token is provided or the token is invalid/expired
 * - Sets req.userId and req.role on success so controllers can use them
 * - Adds WWW-Authenticate header as required by HTTP spec (RFC 7235)
 * Usage: add `authenticate` before any route that requires login
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  // Check that the Authorization header exists and starts with "Bearer "
  if (!authHeader?.startsWith("Bearer ")) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="api", error="missing_token"');
    return res.status(401).json({ error: "No token provided" });
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(" ")[1] as string;

  try {
    // Verify the token signature and expiry using the JWT secret
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Attach userId and role to the request so controllers can access them
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    res.setHeader("WWW-Authenticate", 'Bearer realm="api", error="invalid_token"');
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * requireHost middleware
 * Allows only users with role "host" or "admin" to proceed.
 * Use after authenticate on routes that are host-only (e.g. create listing).
 */
export function requireHost(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "host" || req.role === "admin") return next();
  return res.status(403).json({ error: "Only hosts can perform this action" });
}

/**
 * requireGuest middleware
 * Allows only users with role "guest" or "admin" to proceed.
 * Use after authenticate on routes that are guest-only (e.g. create booking).
 */
export function requireGuest(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "guest" || req.role === "admin") return next();
  return res.status(403).json({ error: "Only guests can perform this action" });
}

/**
 * requireAdmin middleware
 * Allows only users with role "admin" to proceed.
 * Use after authenticate on admin-only routes.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role === "admin") return next();
  return res.status(403).json({ error: "Admin access required" });
}
