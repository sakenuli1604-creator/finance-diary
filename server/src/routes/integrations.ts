import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateIntegration } from '../middlewares/integrationAuth';
import integrationController from '../controllers/integrationController';

const router = Router();

// Защита от подбора токена: Genos делает считанные запросы в час, так что лимит с большим запасом.
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
  })
);

router.use(authenticateIntegration);

// Только чтение
router.get('/genos/overview', (req, res, next) => integrationController.getOverview(req, res, next));
router.get('/genos/goals', (req, res, next) => integrationController.getGoals(req, res, next));

export default router;
