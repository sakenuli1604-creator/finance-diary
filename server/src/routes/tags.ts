import { Router } from 'express';
import tagController from '../controllers/tagController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', tagController.getAll);
router.post('/', tagController.create);
router.put('/:id', tagController.update);
router.delete('/:id', tagController.delete);
router.post('/transaction/:transactionId', tagController.setTransactionTags);

export default router;
