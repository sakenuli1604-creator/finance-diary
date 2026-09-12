import { Router } from 'express';
import feedController from '../controllers/feedController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', feedController.getFeed);

export default router;
