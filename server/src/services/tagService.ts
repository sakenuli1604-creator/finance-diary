import { prisma } from '../lib/prisma';


export interface CreateTagDTO {
  name: string;
  color?: string;
  isProject?: boolean;
}

class TagService {
  async getAll(userId: string) {
    return prisma.tag.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, data: CreateTagDTO) {
    const name = data.name.trim();
    if (!name) {
      throw new Error('Name is required');
    }

    const existing = await prisma.tag.findFirst({ where: { userId, name } });
    if (existing) {
      // тег с таким именем уже есть — переиспользуем, но применяем новые isProject/color,
      // если они переданы (иначе повторное создание "тем же тегом" молча теряло галочку "проект")
      if (data.isProject !== undefined && data.isProject !== existing.isProject) {
        return prisma.tag.update({ where: { id: existing.id }, data: { isProject: data.isProject } });
      }
      return existing;
    }

    return prisma.tag.create({
      data: { userId, name, color: data.color || '#3B82F6', isProject: data.isProject ?? false },
    });
  }

  async update(userId: string, id: string, data: CreateTagDTO) {
    const tag = await prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) {
      throw new Error('Tag not found');
    }

    return prisma.tag.update({
      where: { id },
      data: {
        name: data.name?.trim() || tag.name,
        color: data.color,
        isProject: data.isProject ?? tag.isProject,
      },
    });
  }

  async delete(userId: string, id: string) {
    const tag = await prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) {
      throw new Error('Tag not found');
    }

    await prisma.tag.delete({ where: { id } });
  }

  // Заменяет полный набор тегов у транзакции (используется при создании/редактировании операции)
  async setTransactionTags(userId: string, transactionId: string, tagIds: string[]) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Проверяем что все теги принадлежат этому пользователю
    if (tagIds.length > 0) {
      const count = await prisma.tag.count({ where: { id: { in: tagIds }, userId } });
      if (count !== tagIds.length) {
        throw new Error('One or more tags not found');
      }
    }

    await prisma.$transaction([
      prisma.transactionTag.deleteMany({ where: { transactionId } }),
      ...(tagIds.length > 0
        ? [
            prisma.transactionTag.createMany({
              data: tagIds.map((tagId) => ({ transactionId, tagId })),
            }),
          ]
        : []),
    ]);
  }
}

export default new TagService();
