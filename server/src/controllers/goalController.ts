import { Response, NextFunction } from 'express';
import goalService from '../services/goalService';
import { AuthRequest } from '../middlewares/auth';

class GoalController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const goals = await goalService.getAll(userId);

      res.json(goals);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const goal = await goalService.getById(id, userId);

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { name, targetAmount, accountId, deadline, icon } = req.body;

      if (!name || !targetAmount) {
        return res.status(400).json({
          message: 'name and targetAmount are required',
        });
      }

      if (targetAmount <= 0) {
        return res.status(400).json({
          message: 'targetAmount must be positive',
        });
      }

      const goal = await goalService.create(userId, {
        name,
        targetAmount: parseFloat(targetAmount),
        accountId,
        deadline: deadline ? new Date(deadline) : undefined,
        icon,
      });

      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.targetAmount !== undefined) {
        updateData.targetAmount = parseFloat(updateData.targetAmount);
      }

      if (updateData.deadline) {
        updateData.deadline = new Date(updateData.deadline);
      }

      const goal = await goalService.update(id, userId, updateData);

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const result = await goalService.delete(id, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deposit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { amount, accountId, itemId } = req.body;

      if (!amount || !accountId) {
        return res.status(400).json({
          message: 'amount and accountId are required',
        });
      }

      const goal = await goalService.deposit(
        id,
        userId,
        parseFloat(amount),
        accountId,
        itemId || undefined
      );

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { amount, accountId, itemId } = req.body;

      if (!amount || !accountId) {
        return res.status(400).json({
          message: 'amount and accountId are required',
        });
      }

      const goal = await goalService.withdraw(
        id,
        userId,
        parseFloat(amount),
        accountId,
        itemId || undefined
      );

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { name, targetAmount } = req.body;

      const goal = await goalService.addItem(id, userId, name, parseFloat(targetAmount));

      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id, itemId } = req.params;

      const goal = await goalService.removeItem(id, userId, itemId);

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }
}

export default new GoalController();
