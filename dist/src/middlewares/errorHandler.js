import { ZodError } from "zod";
export const errorHandler = (err, req, res, next) => {
    console.error(err);
    // Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: "Validation error",
            errors: err.issues.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }
    // Prisma errors (basic handling)
    if (err.code === 'P2002') {
        return res.status(409).json({
            message: "Duplicate field value",
        });
    }
    // Default error response
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
};
//# sourceMappingURL=errorHandler.js.map