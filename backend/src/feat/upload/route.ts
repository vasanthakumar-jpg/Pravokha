import { Router } from 'express';
import { UploadController } from './controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// Single file upload
router.post('/single', authenticate, UploadController.uploadSingle);

// Multiple files upload
router.post('/multiple', authenticate, UploadController.uploadMultiple);

export default router;
