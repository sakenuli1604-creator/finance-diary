-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "currency" TEXT NOT NULL DEFAULT '₸';

-- Backfill: у существующих целей суммы фактически считались в основной
-- валюте пользователя — проставляем её явно, чтобы дальше ничего не поплыло
UPDATE "Goal" g
SET "currency" = u."primaryCurrency"
FROM "User" u
WHERE g."userId" = u."id";
