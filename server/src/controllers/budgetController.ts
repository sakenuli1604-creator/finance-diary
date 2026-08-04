import { Response, NextFunction } from 'express';
import budgetService from '../services/budgetService';
import { AuthRequest } from '../middlewares/auth';

class BudgetController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active !== 'false';
      const budgets = await budgetService.getAll(req.userId!, activeOnly);
      res.json(budgets);
    } catch (error) {
      next(error);
    }
  }

  async getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alerts = await budgetService.getAlerts(req.userId!);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetService.getById(req.userId!, req.params.id);
      res.json(budget);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { categoryId, name, amount, period } = req.body;
      if (!name || !amount || !period) {
        return res.status(400).json({ message: 'name, amount and period are required' });
      }
      const budget = await budgetService.create(req.userId!, {
        categoryId: categoryId || undefined,
        name,
        amount: parseFloat(amount),
        period,
      });
      res.status(201).json(budget);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (data.amount !== undefined) data.amount = parseFloat(data.amount);

      const budget = await budgetService.update(req.userId!, req.params.id, data);
      res.json(budget);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await budgetService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new BudgetController();
