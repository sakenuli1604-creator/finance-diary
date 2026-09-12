import { PrismaClient } from '@prisma/client';

// Единственный на всё приложение инстанс Prisma Client — не создаём новый
// в каждом сервисе (иначе плодятся отдельные пулы соединений с БД, и на
// нагрузке это упирается в лимит подключений Postgres).
export const prisma = new PrismaClient();
