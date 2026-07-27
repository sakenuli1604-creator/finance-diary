import { Router } from 'express';
import categoryController from '../controllers/categoryController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

export default router;
