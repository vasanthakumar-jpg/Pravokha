/**
 * Feature Flags Configuration
 * This allows for gradual rollout of new features and instant rollbacks if needed.
 */

export const FLAGS = {
    // Phase 2: Scoped Subcategory Slugs
    ENABLE_SCOPED_SUBCATEGORY_SLUGS: process.env.ENABLE_SCOPED_SUBCATEGORY_SLUGS === 'true' || false,

    // Phase 1: Use /users/me alias in frontend (tracked via backend logs)
    USE_USERS_ME_ENDPOINT: process.env.USE_USERS_ME_ENDPOINT === 'true' || true, // Enabled by default as per plan

    // Add more flags here as needed
};

export const isFeatureEnabled = (flagName: keyof typeof FLAGS) => {
    return FLAGS[flagName];
};
