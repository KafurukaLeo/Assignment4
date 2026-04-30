import rateLimit from "express-rate-limit";
import { success } from "zod";
// General API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to  100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Strict limiter for sensitive routes
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after an hour"
    },
});
//# sourceMappingURL=rateLimiters.js.map