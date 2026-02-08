import { z } from 'zod';

export const profileUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.preprocess((val) => (val === '' ? null : val), z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().nullable()),
    bio: z.preprocess((val) => (val === '' ? null : val), z.string().max(500, 'Bio must be less than 500 characters').optional().nullable()),
    avatarUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    dateOfBirth: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date().optional().nullable()),
});

export const addressSchema = z.object({
    name: z.string().min(2, 'Full name is required (min 2 characters)'),
    phoneNumber: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone number is required'),
    addressLine1: z.string().min(5, 'Street address is too short'),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode is required'),
    type: z.enum(['HOME', 'WORK', 'OTHER']),
    isDefault: z.boolean().default(false),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
