import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

/**
 * validate middleware factory
 * Takes a Zod schema and returns a middleware that validates the request.
 * Validates req.body, req.query, and req.params against the schema.
 * If validation fails, it calls next(error) which is caught by the global errorHandler
 * and returns a 400 response with details about which fields are invalid.
 *
 * Usage example:
 *   router.post("/register", validate(registerSchema), register);
 */
export const validate = (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the request against the schema — throws ZodError if invalid
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // Validation passed — continue to the controller
    } catch (error) {
      next(error); // Pass ZodError to the global error handler
    }
  };
