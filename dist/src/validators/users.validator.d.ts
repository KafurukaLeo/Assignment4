import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodEmail>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=users.validator.d.ts.map