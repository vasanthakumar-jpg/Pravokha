
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phoneNumber: z.string()
        .regex(/^[6-9]\d{9}$/, 'Phone number must be a valid 10-digit Indian number')
        .optional(),
    role: z.enum(['ADMIN', 'SELLER', 'CUSTOMER']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone format').optional().nullable(),
    address: z.string().optional().nullable(),
    storeName: z.string().optional().nullable(),
    storeDescription: z.string().optional().nullable(),
});
