import { Response, NextFunction } from 'express';
import analyticsService from '../services/analyticsService';
import { AuthRequest } from '../middlewares/auth';

// Принимает excludeTagIds как "id1,id2" в query-строке
function parseExcludeTagIds(req: AuthRequest): string[] {
  const raw = req.query.excludeTagIds;
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

class AnalyticsController {
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;
      const excludeTagIds = parseExcludeTagIds(req);

      const summary = await analyticsService.getSummary(userId, dateFrom, dateTo, excludeTagIds);

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
      const excludeTagIds = parseExcludeTagIds(req);

      const data = await analyticsService.getByCategory(userId, dateFrom, dateTo, excludeTagIds);

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
      const excludeTagIds = parseExcludeTagIds(req);

      const trends = await analyticsService.getTrends(userId, dateFrom, dateTo, groupBy, excludeTagIds);

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
      const excludeTagIds = parseExcludeTagIds(req);

      const expenses = await analyticsService.getTopExpenses(
        userId,
        dateFrom,
        dateTo,
        limit,
        excludeTagIds
      );

      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async getProjectsBreakdown(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;

      const projects = await analyticsService.getProjectsBreakdown(userId, dateFrom, dateTo);

      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getTagsBreakdown(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;

      const tags = await analyticsService.getRegularTagsBreakdown(userId, dateFrom, dateTo);

      res.json(tags);
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
