import rateLimit from "express-rate-limit";

/**
 * General rate limiter — applied to ALL routes.
 * Allows up to 100 requests per IP every 15 minutes.
 * Protects the server from being overwhelmed by too many requests.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // max 100 requests per window per IP
  message: { success: false, message: "Too many requests, please try again after 15 minutes." },
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers (deprecated)
});

/**
 * Strict rate limiter — applied only to POST requests.
 * Allows up to 20 requests per IP every 15 minutes.
 * Used to protect write endpoints like login, register, create booking
 * from brute force attacks and spam.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 20,                   // max 20 POST requests per window per IP
  message: { success: false, message: "Too many requests, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
