import { Router } from 'express';
import transactionController from '../controllers/transactionController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// ВАЖНО: /recent и /today-stats должны идти раньше /:id
router.get('/recent', transactionController.getRecent);
router.get('/today-stats', transactionController.getTodayStats);

router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);
router.patch('/:id/rating', transactionController.addRating);

export default router;
