import { Router } from 'express';
import goalController from '../controllers/goalController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', goalController.getAll);
router.get('/:id', goalController.getById);
router.post('/', goalController.create);
router.put('/:id', goalController.update);
router.delete('/:id', goalController.delete);
router.post('/:id/deposit', goalController.deposit);
router.post('/:id/withdraw', goalController.withdraw);

export default router;
