import { Router } from 'express';
import transactionController from '../controllers/transactionController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// ВАЖНО: /recent и /today-stats должны идти раньше /:id
router.get('/recent', transactionController.getRecent);
router.get('/today-stats', transactionController.getTodayStats);
router.get('/deleted', transactionController.getDeleted);
router.delete('/trash/empty', transactionController.emptyTrash);

router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);
router.patch('/:id/rating', transactionController.addRating);
router.post('/:id/restore', transactionController.restore);
router.delete('/:id/permanent', transactionController.permanentDelete);

export default router;
