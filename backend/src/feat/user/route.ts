import { UserController } from './controller';
import { UserPreferenceController } from './preferenceController';
import { authenticate, authorize, checkAccountStatus } from '../../shared/middleware/auth';
import { Router } from 'express';
import { Role } from '@prisma/client';

const router = Router();

// Order matters! Specific routes before parameterized routes

// Profile Routes
router.get('/profile', authenticate, checkAccountStatus, UserController.getMyProfile);
router.get('/me', authenticate, checkAccountStatus, UserController.getMyProfile); // Alias for frontend compatibility
router.patch('/profile', authenticate, checkAccountStatus, UserController.updateProfile);
router.put('/profile', authenticate, checkAccountStatus, UserController.updateProfile); // Support PUT for frontend compatibility

// Admin Stats (Updated to SUPER_ADMIN/ADMIN)
router.get('/admin/stats', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), checkAccountStatus, UserController.getAdminStats);

router.get('/settings/vendor', authenticate, checkAccountStatus, UserController.getVendorSettings);
router.patch('/settings/vendor', authenticate, checkAccountStatus, UserController.updateVendorSettings);

// Address Routes
router.get('/addresses', authenticate, checkAccountStatus, UserController.listAddresses);
router.post('/addresses', authenticate, checkAccountStatus, UserController.addAddress);
router.patch('/addresses/:id', authenticate, checkAccountStatus, UserController.updateAddress);
router.delete('/addresses/:id', authenticate, checkAccountStatus, UserController.deleteAddress);

router.get('/preferences', authenticate, checkAccountStatus, UserPreferenceController.getPreferences);
router.patch('/preferences', authenticate, checkAccountStatus, UserPreferenceController.updatePreferences);

// Admin User Management (Updated for SUPER_ADMIN access)
router.get('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.listUsers);
router.patch('/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.updateUserStatus);
router.patch('/:id/role', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.updateUserRole);
router.post('/:id/verify', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.verifySeller);

// Profile by ID - MUST be last to avoid catching other routes
router.get('/:id', authenticate, checkAccountStatus, UserController.getProfile);

export default router;
