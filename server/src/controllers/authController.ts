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

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Отвечаем сразу и одинаково, независимо от того, есть ли такой аккаунт; письмо уходит в фоне
      authService.requestPasswordReset(email).catch((err) => {
        console.error('[forgot-password] не удалось отправить письмо:', err);
      });

      res.json({ message: 'If an account with this email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
      }

      try {
        await authService.resetPassword(token, password);
      } catch (err: any) {
        if (err.message === 'Invalid or expired token') {
          // 400, а не 401: на 401 клиент делает автоматический редирект на /login
          return res.status(400).json({ message: 'Ссылка недействительна или устарела. Запросите новую.' });
        }
        throw err;
      }

      res.json({ message: 'Password updated' });
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
