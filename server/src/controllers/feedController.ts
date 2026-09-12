import { Response, NextFunction } from 'express';
import feedService from '../services/feedService';
import { AuthRequest } from '../middlewares/auth';

class FeedController {
  async getFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const feed = await feedService.getFeed(req.userId!, limit);
      res.json(feed);
    } catch (error) {
      next(error);
    }
  }
}

export default new FeedController();
