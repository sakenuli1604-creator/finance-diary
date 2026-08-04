import { Response, NextFunction } from 'express';
import tagService from '../services/tagService';
import { AuthRequest } from '../middlewares/auth';

class TagController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tags = await tagService.getAll(req.userId!);
      res.json(tags);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'name is required' });
      }
      const tag = await tagService.create(req.userId!, { name, color });
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const tag = await tagService.update(req.userId!, req.params.id, { name, color });
      res.json(tag);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await tagService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async setTransactionTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ message: 'tagIds must be an array' });
      }
      await tagService.setTransactionTags(req.userId!, req.params.transactionId, tagIds);
      res.json({ message: 'Tags updated' });
    } catch (error) {
      next(error);
    }
  }
}

export default new TagController();
