import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // ссылка живёт 1 час

const hashResetToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');


export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

class AuthService {
  async register(data: RegisterDTO) {
    // Проверяем существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        primaryCurrency: true,
        createdAt: true,
      },
    });

    // Создаем дефолтные категории
    await this.createDefaultCategories(user.id);

    // Генерируем токен
    const token = generateToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  async login(data: LoginDTO) {
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Генерируем токен
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        primaryCurrency: user.primaryCurrency,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  // Всегда завершается без ошибки для несуществующего email — снаружи не должно быть видно, есть ли такой аккаунт
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (!user) return;

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    if (!appUrl) {
      throw new Error('APP_URL is not set (адрес фронтенда для ссылки в письме)');
    }

    const token = crypto.randomBytes(32).toString('hex');

    // старые неиспользованные ссылки этого пользователя аннулируем — действует только последняя
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    const link = `${appUrl}/reset-password?token=${token}`;

    await sendMail({
      to: user.email,
      subject: 'Сброс пароля — Финансовый дневник',
      text:
        `Здравствуйте, ${user.name}!\n\n` +
        `Чтобы задать новый пароль, откройте ссылку (действует 1 час):\n${link}\n\n` +
        `Если вы не запрашивали сброс — просто проигнорируйте это письмо, пароль не изменится.`,
      html:
        `<p>Здравствуйте, ${user.name.replace(/[<>&"]/g, '')}!</p>` +
        `<p>Чтобы задать новый пароль, нажмите на кнопку (ссылка действует 1 час):</p>` +
        `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Сбросить пароль</a></p>` +
        `<p style="color:#666;font-size:13px">Или скопируйте ссылку в браузер:<br>${link}</p>` +
        `<p style="color:#666;font-size:13px">Если вы не запрашивали сброс — просто проигнорируйте это письмо, пароль не изменится.</p>`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      // ссылка одноразовая; заодно чистим все остальные токены пользователя
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        primaryCurrency: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async createDefaultCategories(userId: string) {
    const defaultCategories = [
      // Расходы
      { name: 'Еда', type: 'expense', icon: '🍔', color: '#EF4444' },
      { name: 'Такси', type: 'expense', icon: '🚕', color: '#F59E0B' },
      { name: 'Покупки', type: 'expense', icon: '🛍️', color: '#8B5CF6' },
      { name: 'Заказы', type: 'expense', icon: '📦', color: '#EC4899' },
      { name: 'Спонтанные покупки', type: 'expense', icon: '💸', color: '#EF4444' },
      { name: 'Развлечения', type: 'expense', icon: '🎮', color: '#10B981' },
      { name: 'Транспорт', type: 'expense', icon: '🚌', color: '#3B82F6' },
      { name: 'Коммунальные услуги', type: 'expense', icon: '🏠', color: '#6366F1' },
      { name: 'Здоровье', type: 'expense', icon: '💊', color: '#EF4444' },
      { name: 'Учеба', type: 'expense', icon: '📚', color: '#8B5CF6' },
      { name: 'Техника', type: 'expense', icon: '💻', color: '#6B7280' },
      { name: 'Другое', type: 'expense', icon: '📌', color: '#9CA3AF' },

      // Доходы
      { name: 'Стипендия', type: 'income', icon: '🎓', color: '#10B981' },
      { name: 'Зарплата', type: 'income', icon: '💰', color: '#10B981' },
      { name: 'Подарок', type: 'income', icon: '🎁', color: '#EC4899' },
      { name: 'Продажа', type: 'income', icon: '💵', color: '#10B981' },
      { name: 'Другое', type: 'income', icon: '📌', color: '#9CA3AF' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId,
        isDefault: true,
      })),
    });
  }
}

export default new AuthService();
