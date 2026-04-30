import { z } from 'zod';
export const createUserSchema = z.object({
    body: z.object({   
        title: z.string().min(3),
        description: z.string().min(12),
        price: z.number(),
        tags: z.array(z.string()).optional(), 
    }),
    });

    export const updateUserSchema = z.object({  
        body: z.object({  
            title: z.string().min(5).optional(), 
            description: z.string().min(12).optional(),
            price: z.number().positive().optional(),
            tags: z.array(z.string()).optional(), 
        }),
    });

    