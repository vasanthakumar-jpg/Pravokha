import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        role: z.enum(['ADMIN', 'DEALER']).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const productSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().nonnegative().default(0),
    }),
});
