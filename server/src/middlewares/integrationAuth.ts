import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

// Отдельный read-only доступ для внешних интеграций (Genos на домашнем сервере).
//
// Это НЕ JWT пользователя: токен задаётся переменной окружения GENOS_API_TOKEN, а владелец данных —
// GENOS_USER_EMAIL. Токен действует только на маршрутах /api/integrations/genos/* (см. routes/integrations.ts),
// а они только читают. Поэтому даже при утечке токена нельзя ни войти в аккаунт, ни что-то изменить.
// Если переменные не заданы (или токен короче 32 символов), интеграция выключена и маршруты отвечают 404.

const MIN_TOKEN_LENGTH = 32;

function safeEqual(a: string, b: string): boolean {
  // сравниваем хэши, чтобы не зависеть от длины и не давать утечку по времени
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

let cachedUser: { email: string; id: string } | null = null;
let warnedWeakToken = false;

export const authenticateIntegration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expected = process.env.GENOS_API_TOKEN;
    const email = process.env.GENOS_USER_EMAIL?.trim();

    if (!expected || !email) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    if (expected.length < MIN_TOKEN_LENGTH) {
      if (!warnedWeakToken) {
        console.warn(`GENOS_API_TOKEN короче ${MIN_TOKEN_LENGTH} символов: интеграция выключена`);
        warnedWeakToken = true;
      }
      res.status(404).json({ message: 'Not found' });
      return;
    }

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    if (!safeEqual(header.substring(7), expected)) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    if (!cachedUser || cachedUser.email !== email) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!user) {
        res.status(500).json({ message: 'Integration user not found' });
        return;
      }
      cachedUser = { email, id: user.id };
    }

    req.userId = cachedUser.id;
    next();
  } catch (error) {
    next(error);
  }
};
