import { prisma } from '../lib/prisma';
import { DEFAULT_TIMEZONE, isValidTimeZone } from './timezone';

export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return user && isValidTimeZone(user.timezone) ? user.timezone : DEFAULT_TIMEZONE;
}
