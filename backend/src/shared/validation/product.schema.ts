
import { z } from 'zod';

export const createProductSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    discountPrice: z.number().optional().nullable(),
    discount_price: z.number().optional().nullable(), // Support snake_case from frontend
    stock: z.number().int().nonnegative('Stock cannot be negative').optional().default(0),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    subcategoryId: z.string().uuid('Invalid subcategory ID').optional().nullable(),
    slug: z.string().optional(),
    sku: z.string().optional(),
    published: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
    is_featured: z.boolean().optional(),
    isNew: z.boolean().optional().default(false),
    is_new: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    seller_id: z.string().optional(),
    variants: z.array(z.any()).optional(), // Will be handled in service
});

export const updateProductSchema = createProductSchema.partial();
