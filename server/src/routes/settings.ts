import { Router } from 'express';
import settingsController from '../controllers/settingsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/profile', authenticate, settingsController.getProfile);
router.patch('/profile', authenticate, settingsController.updateProfile);
router.get('/exchange-rates', authenticate, settingsController.getRates);

export default router;
