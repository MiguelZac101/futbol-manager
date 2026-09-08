-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "demoKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_demoKey_key" ON "Tournament"("demoKey");
