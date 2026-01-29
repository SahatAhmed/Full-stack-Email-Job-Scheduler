import { Router } from 'express';
import { upload } from '../middleware/upload';
import { sendEmail } from '../controllers/email.controller';

const router = Router();

// IMPORTANT LINE 👇
router.post(
  '/send',
  upload.array('attachments'), // field name MUST match frontend
  sendEmail
);

export default router;