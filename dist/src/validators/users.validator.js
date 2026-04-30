import { z } from 'zod';
export const createUserSchema = z.object({
    body: z.object({
        username: z.string().min(3).optional(),
        email: z.email().optional(),
    }),
});
//# sourceMappingURL=users.validator.js.map