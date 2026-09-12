import { Router } from 'express';
import budgetController from '../controllers/budgetController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', budgetController.getAll);
router.get('/alerts', budgetController.getAlerts);
router.get('/:id', budgetController.getById);
router.post('/', budgetController.create);
router.put('/:id', budgetController.update);
router.delete('/:id', budgetController.delete);

export default router;
