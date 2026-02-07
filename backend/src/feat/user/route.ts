import { UserController } from './controller';
import { UserPreferenceController } from './preferenceController';
import { authenticate, authorize, checkAccountStatus } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validation';
import { profileUpdateSchema, addressSchema, userPreferenceSchema } from '../../shared/validation/user.schema';
import { vendorSettingsSchema } from '../../shared/validation/vendor.schema';
import { Router } from 'express';
import { Role } from '@prisma/client';

const router = Router();

// Order matters! Specific routes before parameterized routes

// Profile Routes
router.get('/profile', authenticate, checkAccountStatus, UserController.getMyProfile);
router.get('/me', authenticate, checkAccountStatus, UserController.getMyProfile);
router.patch('/profile', authenticate, checkAccountStatus, validate({ body: profileUpdateSchema }), UserController.updateProfile);
router.put('/profile', authenticate, checkAccountStatus, validate({ body: profileUpdateSchema }), UserController.updateProfile);

// Admin Stats (Updated to SUPER_ADMIN/ADMIN)
router.get('/admin/stats', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), checkAccountStatus, UserController.getAdminStats);

router.get('/settings/vendor', authenticate, checkAccountStatus, UserController.getVendorSettings);
router.patch('/settings/vendor', authenticate, checkAccountStatus, validate({ body: vendorSettingsSchema }), UserController.updateVendorSettings);
router.put('/settings/vendor', authenticate, checkAccountStatus, validate({ body: vendorSettingsSchema }), UserController.updateVendorSettings);


// Address Routes
router.get('/addresses', authenticate, checkAccountStatus, UserController.listAddresses);
router.post('/addresses', authenticate, checkAccountStatus, validate({ body: addressSchema }), UserController.addAddress);
router.patch('/addresses/:id', authenticate, checkAccountStatus, validate({ body: addressSchema.partial() }), UserController.updateAddress);
router.delete('/addresses/:id', authenticate, checkAccountStatus, UserController.deleteAddress);

router.get('/preferences', authenticate, checkAccountStatus, UserPreferenceController.getPreferences);
router.patch('/preferences', authenticate, checkAccountStatus, validate({ body: userPreferenceSchema }), UserPreferenceController.updatePreferences);

// Admin User Management (Updated for SUPER_ADMIN access)
router.get('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.listUsers);
router.patch('/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.updateUserStatus);
router.patch('/:id/role', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.updateUserRole);
router.post('/:id/verify', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, UserController.verifySeller);

// Profile by ID - MUST be last to avoid catching other routes
router.get('/:id', authenticate, checkAccountStatus, UserController.getProfile);

export default router;
