import { Router } from 'express';
import analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', analyticsController.getSummary);
router.get('/by-category', analyticsController.getByCategory);
router.get('/trends', analyticsController.getTrends);
router.get('/top-expenses', analyticsController.getTopExpenses);
router.get('/expensive-days', analyticsController.getExpensiveDays);
router.get('/accounts-breakdown', analyticsController.getAccountsBreakdown);
router.get('/rating-stats', analyticsController.getRatingStats);
router.get('/pending-reviews', analyticsController.getPendingReviews);
router.get('/regretted-purchases', analyticsController.getRegrettedPurchases);

export default router;
