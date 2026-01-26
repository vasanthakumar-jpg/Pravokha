/**
 * TypeScript interfaces for Admin Settings
 * All properties use camelCase to match backend API responses from Prisma
 */

// Admin Site Settings (from SiteSetting model)
export interface AdminSiteSettings {
    id: string;
    storeName: string;
    storeUrl: string;
    maintenanceMode: boolean;
    autoConfirmOrders: boolean;
    logoUrl: string | null;
    bannerUrl: string | null;
    currency: string;
    timezone: string;
    analyticsEnabled: boolean;
    aiInsightsEnabled: boolean;
    payoutAutomationEnabled: boolean;
    sessionTrackingEnabled: boolean;
    dataAnonymizationEnabled: boolean;
    publicIndexingEnabled: boolean;
    updatedAt: string;
}

// Admin Profile (from User model)
export interface AdminProfile {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    avatarUrl: string | null;
    bio: string | null;
    dateOfBirth: string | null;
    role: 'ADMIN' | 'DEALER' | 'USER';
    status: string;
    verificationStatus: string;
}

// Admin Notification Preferences
export interface AdminNotificationPreferences {
    id: string;
    adminId: string;
    governanceAlerts: boolean;
    revenueTelemetry: boolean;
    inventoryCriticality: boolean;
    updatedAt: string;
}

// Admin System Configuration (subset of SiteSetting)
export interface AdminSystemConfig {
    currency: string;
    timezone: string;
    analyticsEnabled: boolean;
    aiInsightsEnabled: boolean;
    payoutAutomationEnabled: boolean;
    sessionTrackingEnabled: boolean;
    dataAnonymizationEnabled: boolean;
    publicIndexingEnabled: boolean;
}

// Role Counts Response
export interface AdminRoleCounts {
    super_admins: number;
    sellers: number;
    support: number;
}

// API Response Wrappers
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    settings?: T;
    counts?: T;
    message?: string;
}

// Combined Admin Settings State
export interface AdminSettingsState {
    profile: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        avatarUrl: string;
    };
    store: {
        storeName: string;
        storeUrl: string;
        maintenanceMode: boolean;
        autoConfirmOrders: boolean;
        logoUrl: string;
        bannerUrl: string;
    };
    notifications: {
        governanceAlerts: boolean;
        revenueTelemetry: boolean;
        inventoryCriticality: boolean;
    };
    system: {
        currency: string;
        timezone: string;
        analyticsEnabled: boolean;
        aiInsightsEnabled: boolean;
        payoutAutomationEnabled: boolean;
        sessionTrackingEnabled: boolean;
        dataAnonymizationEnabled: boolean;
        publicIndexingEnabled: boolean;
    };
}
