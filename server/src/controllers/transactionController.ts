import { Response, NextFunction } from 'express';
import transactionService from '../services/transactionService';
import { AuthRequest } from '../middlewares/auth';

class TransactionController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { accountId, categoryId, type, dateFrom, dateTo, search, amountMin, amountMax, limit } = req.query;

      const transactions = await transactionService.getAll(userId, {
        accountId: accountId as string,
        categoryId: categoryId as string,
        type: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        search: search as string,
        amountMin: amountMin ? parseFloat(amountMin as string) : undefined,
        amountMax: amountMax ? parseFloat(amountMax as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const transactions = await transactionService.getRecent(userId, limit);

      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  async getTodayStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const stats = await transactionService.getTodayStats(userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const transaction = await transactionService.getById(userId, req.params.id);

      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const transaction = await transactionService.create(userId, req.body);

      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  async createSplit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const transactions = await transactionService.createSplit(userId, req.body);

      res.status(201).json(transactions);
    } catch (error) {
      next(error);
    }
  }

  async bulkImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { accountId, rows } = req.body;

      if (!accountId || !Array.isArray(rows)) {
        return res.status(400).json({ message: 'accountId and rows are required' });
      }

      const result = await transactionService.bulkImport(userId, accountId, rows);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const transaction = await transactionService.update(
        userId,
        req.params.id,
        req.body
      );

      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await transactionService.delete(userId, req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addRating(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { rating } = req.body;

      if (rating === undefined) {
        return res.status(400).json({ message: 'rating is required' });
      }

      const transaction = await transactionService.addRating(
        userId,
        req.params.id,
        Number(rating)
      );

      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  async getShopSuggestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const suggestions = await transactionService.getShopSuggestions(req.userId!);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  }

  async getDeleted(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const transactions = await transactionService.getDeleted(userId, limit);

      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  async restore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await transactionService.restore(userId, req.params.id);

      res.json({ message: 'Transaction restored' });
    } catch (error) {
      next(error);
    }
  }

  async permanentDelete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await transactionService.permanentDelete(userId, req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async emptyTrash(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const result = await transactionService.emptyTrash(userId, days);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
