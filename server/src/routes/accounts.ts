import { Router } from 'express';
import accountController from '../controllers/accountController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// ВАЖНО: /total-balance должен идти раньше /:id, иначе Express примет
// "total-balance" за значение параметра :id
router.get('/total-balance', accountController.getTotalBalance);

router.get('/', accountController.getAll);
router.post('/', accountController.create);
router.get('/:id', accountController.getById);
router.put('/:id', accountController.update);
router.delete('/:id', accountController.delete);
router.get('/:id/history', accountController.getHistory);

export default router;
