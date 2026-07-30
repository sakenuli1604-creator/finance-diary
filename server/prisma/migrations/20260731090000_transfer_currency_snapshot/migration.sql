-- AlterTable: добавляем поля валют и зачисленной суммы с временными дефолтами
ALTER TABLE "Transfer" ADD COLUMN "currency" TEXT NOT NULL DEFAULT '₸';
ALTER TABLE "Transfer" ADD COLUMN "toCurrency" TEXT NOT NULL DEFAULT '₸';
ALTER TABLE "Transfer" ADD COLUMN "receivedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Backfill для уже существующих переводов (если есть):
-- currency/toCurrency берём по ТЕКУЩЕЙ валюте соответствующих счетов,
-- receivedAmount по старой логике совпадала с amount (конвертации раньше не было).
UPDATE "Transfer" t
SET
  "currency" = fa."currency",
  "toCurrency" = ta."currency",
  "receivedAmount" = t."amount"
FROM "Account" fa, "Account" ta
WHERE t."fromAccountId" = fa."id" AND t."toAccountId" = ta."id";
