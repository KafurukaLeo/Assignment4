import { z } from 'zod';
export declare const createBookingSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        listingId: z.ZodString;
        check_in: z.ZodString;
        check_out: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=bookings.validator.d.ts.map