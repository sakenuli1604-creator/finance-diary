import jwt from 'jsonwebtoken';

// Никакого fallback-значения — если секрет не задан в переменных окружения,
// сервер должен упасть при старте, а не тихо подписывать токены предсказуемым
// ключом (иначе кто угодно сможет подделать токен для чужого аккаунта).
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. Set it in Railway → Variables before starting the server.'
  );
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
