/*
  Warnings:

  - Made the column `teamOneScore` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `teamTwoScore` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fecha" ADD COLUMN     "date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "teamOneScore" SET NOT NULL,
ALTER COLUMN "teamOneScore" SET DEFAULT 0,
ALTER COLUMN "teamTwoScore" SET NOT NULL,
ALTER COLUMN "teamTwoScore" SET DEFAULT 0;
