-- AlterTable: добавляем поля для корзины (мягкого удаления)
ALTER TABLE "Transaction" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Индекс, чтобы быстро отфильтровывать удалённые/неудалённые операции
CREATE INDEX "Transaction_userId_isDeleted_idx" ON "Transaction"("userId", "isDeleted");
