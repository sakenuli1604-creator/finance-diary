import { Response, NextFunction } from 'express';
import transferService from '../services/transferService';
import { AuthRequest } from '../middlewares/auth';

class TransferController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const transfers = await transferService.getAll(userId, limit);

      res.json(transfers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const transfer = await transferService.getById(id, userId);

      res.json(transfer);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { fromAccountId, toAccountId, amount, description } = req.body;

      if (!fromAccountId || !toAccountId || !amount) {
        return res.status(400).json({
          message: 'fromAccountId, toAccountId, and amount are required',
        });
      }

      const transfer = await transferService.create(userId, {
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        description,
      });

      res.status(201).json(transfer);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const result = await transferService.delete(id, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TransferController();
