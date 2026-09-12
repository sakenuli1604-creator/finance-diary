import { Response, NextFunction } from 'express';
import categoryService from '../services/categoryService';
import { AuthRequest } from '../middlewares/auth';

class CategoryController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const type = req.query.type as string | undefined;

      const categories = await categoryService.getAll(userId, type);

      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const category = await categoryService.getById(userId, req.params.id);

      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async getUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const type = req.query.type as string | undefined;

      const counts = await categoryService.getUsageCounts(userId, type);

      res.json(counts);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const category = await categoryService.create(userId, req.body);

      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const category = await categoryService.update(
        userId,
        req.params.id,
        req.body
      );

      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await categoryService.delete(userId, req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
