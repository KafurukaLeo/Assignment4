import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Global error handler middleware.
 * Must be registered LAST in index.ts (after all routes) using app.use(errorHandler).
 * Catches errors passed via next(error) from any controller or middleware.
 *
 * Handles:
 * - ZodError: validation errors from request body/query/params validation
 * - Prisma P2002: unique constraint violation (duplicate email, username, etc.)
 * - Everything else: returns the error message or a generic 500
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    // Zod validation errors — return 400 with details about which fields failed
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: "Validation error",
            errors: err.issues.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }

    // Prisma unique constraint error — happens when email or username already exists
    if (err.code === 'P2002') {
        return res.status(409).json({
            message: "Duplicate field value",
        });
    }

    // Default: use the error's status code if available, otherwise 500
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
};
