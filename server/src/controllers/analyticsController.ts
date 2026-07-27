import { Response, NextFunction } from 'express';
import analyticsService from '../services/analyticsService';
import { AuthRequest } from '../middlewares/auth';

class AnalyticsController {
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;

      const summary = await analyticsService.getSummary(userId, dateFrom, dateTo);

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;

      const data = await analyticsService.getByCategory(userId, dateFrom, dateTo);

      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      if (!req.query.from || !req.query.to) {
        return res.status(400).json({
          message: 'from and to dates are required',
        });
      }

      const dateFrom = new Date(req.query.from as string);
      const dateTo = new Date(req.query.to as string);
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

      const trends = await analyticsService.getTrends(userId, dateFrom, dateTo, groupBy);

      res.json(trends);
    } catch (error) {
      next(error);
    }
  }

  async getTopExpenses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const expenses = await analyticsService.getTopExpenses(
        userId,
        dateFrom,
        dateTo,
        limit
      );

      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async getExpensiveDays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const days = await analyticsService.getExpensiveDays(
        userId,
        dateFrom,
        dateTo,
        limit
      );

      res.json(days);
    } catch (error) {
      next(error);
    }
  }

  async getAccountsBreakdown(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const breakdown = await analyticsService.getAccountsBreakdown(userId);

      res.json(breakdown);
    } catch (error) {
      next(error);
    }
  }

  async getRatingStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const stats = await analyticsService.getRatingStats(userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getPendingReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const pending = await analyticsService.getPendingReviews(userId);

      res.json(pending);
    } catch (error) {
      next(error);
    }
  }

  async getRegrettedPurchases(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const regretted = await analyticsService.getRegrettedPurchases(userId);

      res.json(regretted);
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
