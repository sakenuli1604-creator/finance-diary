import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { AuthRequest } from '../middlewares/auth';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const result = await authService.register({ email, password, name });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const result = await authService.login({ email, password });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const user = await authService.getMe(userId);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
