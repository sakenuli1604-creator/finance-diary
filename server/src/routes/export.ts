import { Router } from 'express';
import exportController from '../controllers/exportController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/transactions', exportController.exportTransactions);
router.get('/accounts', exportController.exportAccounts);
router.get('/goals', exportController.exportGoals);

export default router;
