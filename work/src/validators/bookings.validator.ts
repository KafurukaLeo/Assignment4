import {z} from 'zod';

export const createBookingSchema = z.object({
    body: z.object({
        userId: z.string(),
        listingId: z.string(),
        check_in: z.string(),
        check_out: z.string(),
    }),

});