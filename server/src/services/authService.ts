import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';


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
