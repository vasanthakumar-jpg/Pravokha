import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { requirePermission } from '../../shared/middleware/permission';
import {
    updateAdminPermissions,
    getAdminPermissions,
    suspendUser,
    activateUser,
    getAuditLogs,
    getDashboardStats,
    getSiteSettings,
    updateSiteSettings,
    getNotificationSettings,
    updateNotificationSettings,
    updateSystemSettings,
    getProductUpdateRequests,
    updateProductRequestStatus
} from './controller';

const router = Router();

router.use(authenticate);

// Dashboard Stats
router.get('/stats', requirePermission('VIEW_ANALYTICS', 'SYSTEM'), getDashboardStats);

// Site Settings
router.get('/settings/site', requirePermission('MANAGE_SETTINGS', 'SYSTEM'), getSiteSettings);
router.put('/settings/site', requirePermission('MANAGE_SETTINGS', 'SYSTEM'), updateSiteSettings);
router.get('/settings/notifications', requirePermission('MANAGE_SETTINGS', 'SYSTEM'), getNotificationSettings);
router.put('/settings/notifications', requirePermission('MANAGE_SETTINGS', 'SYSTEM'), updateNotificationSettings);
router.put('/settings/system', requirePermission('MANAGE_SETTINGS', 'SYSTEM'), updateSystemSettings);

// Product Update Requests (Governance)
router.get('/product-updates', requirePermission('MANAGE_PRODUCTS', 'MARKETPLACE'), getProductUpdateRequests);
router.patch('/product-updates/:id', requirePermission('MANAGE_PRODUCTS', 'MARKETPLACE'), updateProductRequestStatus);

// Permission Management (Restricted to SUPER_ADMIN internally, but guarded by middleware for logging/RBAC)
router.post('/permissions/:adminId', requirePermission('MANAGE_ADMINS', 'SYSTEM'), updateAdminPermissions);
router.get('/permissions/:adminId', requirePermission('MANAGE_ADMINS', 'SYSTEM'), getAdminPermissions);

// User Management
router.post('/users/:userId/suspend', requirePermission('SUSPEND_USER', 'USER'), suspendUser);
router.post('/users/:userId/activate', requirePermission('ACTIVATE_USER', 'USER'), activateUser);

// Audit Logs
router.get('/audit-logs', requirePermission('VIEW_AUDIT_LOGS', 'SYSTEM'), getAuditLogs);

export default router;
