
import { z } from 'zod';

export const createProductSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    subcategoryId: z.string().uuid('Invalid subcategory ID').optional().nullable(),
    published: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();
