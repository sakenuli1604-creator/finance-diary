import { Router } from 'express';
import transferController from '../controllers/transferController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', transferController.getAll);
router.get('/:id', transferController.getById);
router.post('/', transferController.create);
router.delete('/:id', transferController.delete);

export default router;
