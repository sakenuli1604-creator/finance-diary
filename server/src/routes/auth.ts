import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Защита от подбора пароля/спам-регистраций: 20 попыток за 15 минут с одного IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много попыток. Попробуйте позже.' },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
