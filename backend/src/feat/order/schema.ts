import { z } from 'zod';

export const createOrderSchema = z.object({
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(10),
    shippingAddress: z.string().min(5),
    shippingCity: z.string().min(2),
    shippingPincode: z.string().length(6),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variantId: z.string().optional(),
        color: z.string().optional(),
        size: z.string().optional(),
    })).min(1),
    paymentMethod: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    stripeIntentId: z.string().optional(),
});
