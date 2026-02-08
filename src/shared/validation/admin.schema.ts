import { z } from 'zod';

export const siteSettingsSchema = z.object({
    storeName: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(2, 'Store name is too short').optional()),
    storeUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    maintenanceMode: z.boolean().optional(),
    autoConfirmOrders: z.boolean().optional(),
    logoUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    bannerUrl: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
    commissionRate: z.number().min(0).max(100).optional(),
    defaultShippingFee: z.number().min(0).optional(),
    taxRate: z.number().min(0).max(100).optional(),
});

export const notificationSettingsSchema = z.object({
    governanceAlerts: z.boolean().optional(),
    revenueTelemetry: z.boolean().optional(),
    inventoryCriticality: z.boolean().optional(),
});

export const systemSettingsSchema = z.object({
    currency: z.preprocess((val) => (val === '' ? undefined : val), z.string().length(3).optional()),
    timezone: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    googleAnalyticsId: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional().nullable()),
    analyticsEnabled: z.boolean().optional(),
    aiInsightsEnabled: z.boolean().optional(),
    payoutAutomationEnabled: z.boolean().optional(),
    sessionTrackingEnabled: z.boolean().optional(),
    dataAnonymizationEnabled: z.boolean().optional(),
    publicIndexingEnabled: z.boolean().optional(),
});
