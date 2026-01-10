import { UserController } from './controller';
import { PreferenceController } from './preferenceController';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

router.get('/:id', authenticate, UserController.getProfile);
router.patch('/profile', authenticate, UserController.updateProfile);
router.get('/settings/dealer', authenticate, UserController.getDealerSettings);
router.patch('/settings/dealer', authenticate, UserController.updateDealerSettings);

// Address Routes
router.get('/addresses', authenticate, UserController.listAddresses);
router.post('/addresses', authenticate, UserController.addAddress);
router.patch('/addresses/:id', authenticate, UserController.updateAddress);
router.delete('/addresses/:id', authenticate, UserController.deleteAddress);

router.get('/preferences', authenticate, PreferenceController.getPreferences);
router.patch('/preferences', authenticate, PreferenceController.updatePreferences);

// Admin User Management
router.get('/', authenticate, authorize(['ADMIN']), UserController.listUsers);
router.patch('/:id/status', authenticate, authorize(['ADMIN']), UserController.updateUserStatus);
router.patch('/:id/role', authenticate, authorize(['ADMIN']), UserController.updateUserRole);
router.post('/:id/verify', authenticate, authorize(['ADMIN']), UserController.verifySeller);

export default router;
