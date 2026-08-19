-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "fixtureStartTime" TEXT NOT NULL DEFAULT '10:00',
ADD COLUMN     "matchIntervalMinutes" INTEGER NOT NULL DEFAULT 40;
