import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
        email: z.ZodEmail;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=profile.validator.d.ts.map