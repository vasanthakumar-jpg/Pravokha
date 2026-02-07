import { z } from 'zod';

export const siteSettingsSchema = z.object({
    storeName: z.string().min(2, 'Store name is too short').optional(),
    storeUrl: z.string().url('Invalid store URL').optional(),
    maintenanceMode: z.boolean().optional(),
    autoConfirmOrders: z.boolean().optional(),
    logoUrl: z.string().url('Invalid URL').optional().nullable(),
    bannerUrl: z.string().url('Invalid URL').optional().nullable(),
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
    currency: z.string().length(3).optional(),
    timezone: z.string().optional(),
    analyticsEnabled: z.boolean().optional(),
    aiInsightsEnabled: z.boolean().optional(),
    payoutAutomationEnabled: z.boolean().optional(),
    sessionTrackingEnabled: z.boolean().optional(),
    dataAnonymizationEnabled: z.boolean().optional(),
    publicIndexingEnabled: z.boolean().optional(),
});
