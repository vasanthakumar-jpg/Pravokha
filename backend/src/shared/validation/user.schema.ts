import { z } from 'zod';

export const profileUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.preprocess((val) => (val === '' ? null : val), z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().nullable()),
    bio: z.preprocess((val) => (val === '' ? null : val), z.string().max(500, 'Bio must be less than 500 characters').optional().nullable()),
    avatarUrl: z.preprocess((val) => (val === '' ? null : val), z.string().url('Invalid avatar URL').optional().nullable()),
    dateOfBirth: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date().optional().nullable()),
});

export const addressSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    addressLine1: z.string().min(5, 'Address line 1 must be at least 5 characters'),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
    isDefault: z.boolean().default(false),
});

export const userPreferenceSchema = z.object({
    emailNotifications: z.boolean(),
    orderUpdates: z.boolean(),
    marketingEmails: z.boolean(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
