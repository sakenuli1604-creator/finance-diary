import { Response, NextFunction } from 'express';
import accountService from '../services/accountService';
import { AuthRequest } from '../middlewares/auth';

class AccountController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const accounts = await accountService.getAll(userId);
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const account = await accountService.getById(userId, req.params.id);
      res.json(account);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const account = await accountService.create(userId, req.body);
      res.status(201).json(account);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const account = await accountService.update(userId, req.params.id, req.body);
      res.json(account);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await accountService.delete(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getTotalBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const result = await accountService.getTotalBalance(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const history = await accountService.getHistory(userId, req.params.id, limit);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountController();
