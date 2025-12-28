-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "tasks_deletedAt_idx" ON "tasks"("deletedAt");
