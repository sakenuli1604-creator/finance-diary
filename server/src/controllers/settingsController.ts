import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { isValidTimeZone } from '../utils/timezone';
import { AuthRequest } from '../middlewares/auth';
import { getExchangeRates } from '../services/exchangeRateService';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  primaryCurrency: true,
  timezone: true,
  createdAt: true,
};

class SettingsController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: PROFILE_SELECT,
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, primaryCurrency, timezone } = req.body;

      if (primaryCurrency && !SUPPORTED_CURRENCIES.includes(primaryCurrency)) {
        return res.status(400).json({ message: 'Неподдерживаемая валюта' });
      }

      if (timezone !== undefined && !isValidTimeZone(timezone)) {
        return res.status(400).json({ message: 'Неизвестный часовой пояс' });
      }

      const data: { name?: string; primaryCurrency?: string; timezone?: string } = {};
      if (typeof timezone === 'string') {
        data.timezone = timezone;
      }
      if (typeof name === 'string' && name.trim().length > 0) {
        data.name = name.trim();
      }
      if (typeof primaryCurrency === 'string') {
        data.primaryCurrency = primaryCurrency;
      }

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data,
        select: PROFILE_SELECT,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getRates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const snapshot = await getExchangeRates();
      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
