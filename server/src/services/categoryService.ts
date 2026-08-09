import { prisma } from '../lib/prisma';


export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
}

class CategoryService {
  async getAll(userId: string, type?: string) {
    const where: any = {
      OR: [{ userId }, { userId: null }],
    };

    if (type) {
      where.type = type;
    }

    return prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async getById(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  /**
   * Сколько раз пользователь использовал каждую категорию (для сортировки
   * "избранных"/часто используемых категорий первыми в выборе категории).
   */
  async getUsageCounts(userId: string, type?: string) {
    const where: any = { userId, isDeleted: false };
    if (type) where.type = type;

    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _count: { categoryId: true },
    });

    const counts: Record<string, number> = {};
    grouped.forEach((g) => {
      counts[g.categoryId] = g._count.categoryId;
    });

    return counts;
  }

  async create(userId: string, data: CreateCategoryDTO) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Category name is required');
    }

    if (data.type !== 'income' && data.type !== 'expense') {
      throw new Error('type must be income or expense');
    }

    return prisma.category.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type,
        icon: data.icon,
        color: data.color,
        isDefault: false,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateCategoryDTO) {
    const category = await this.getById(userId, id);

    if (category.isDefault || category.userId === null) {
      throw new Error('Cannot edit a default category');
    }

    if (category.userId !== userId) {
      throw new Error('Category not found');
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const category = await this.getById(userId, id);

    if (category.isDefault || category.userId === null) {
      throw new Error('Cannot delete a default category');
    }

    if (category.userId !== userId) {
      throw new Error('Category not found');
    }

    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new Error('Cannot delete a category that has transactions');
    }

    await prisma.category.delete({ where: { id } });
  }
}

export default new CategoryService();
