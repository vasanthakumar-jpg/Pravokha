import { z } from 'zod';

export const vendorSettingsSchema = z.object({
    storeName: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(3, 'Store name must be at least 3 characters').max(50).optional()),
    storeDescription: z.preprocess((val) => (val === '' ? null : val), z.string().max(1000, 'Description is too long').optional().nullable()),
    supportEmail: z.preprocess((val) => (val === '' ? null : val), z.string().email('Invalid email address').optional().nullable()),
    supportPhone: z.preprocess((val) => (val === '' ? null : val), z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits').optional().nullable()),
    businessAddress: z.preprocess((val) => (val === '' ? null : val), z.string().min(5, 'Address must be at least 5 characters').optional().nullable()),

    // Business Details
    gstNumber: z.preprocess((val) => (val === '' ? null : val), z.string()
        .transform(v => v?.toUpperCase())
        .pipe(
            z.string()
                .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST Format')
        )
        .optional()
        .nullable()),
    panNumber: z.preprocess((val) => (val === '' ? null : val), z.string()
        .transform(v => v?.toUpperCase())
        .pipe(
            z.string()
                .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Format')
        )
        .optional()
        .nullable()),

    // Bank Details
    bankAccountNumber: z.preprocess((val) => (val === '' ? null : val), z.string().min(8, 'Account number is too short').optional().nullable()),
    bankIfscCode: z.preprocess((val) => (val === '' ? null : val), z.string()
        .transform(v => v?.toUpperCase())
        .pipe(
            z.string()
                .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC')
        )
        .optional()
        .nullable()),
    beneficiaryName: z.preprocess((val) => (val === '' ? null : val), z.string().min(2, 'Beneficiary name is too short').optional().nullable()),
    bankName: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),

    // Config
    vacationMode: z.boolean().optional(),
    autoConfirm: z.boolean().optional(),
    returnPolicy: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    logoUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    bannerUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    metaTitle: z.string().max(60, 'Meta title too long').optional().nullable(),
    metaDescription: z.string().max(160, 'Meta description too long').optional().nullable(),
});
