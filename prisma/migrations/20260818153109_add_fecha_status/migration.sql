-- CreateEnum
CREATE TYPE "FechaStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Fecha" ADD COLUMN     "status" "FechaStatus" NOT NULL DEFAULT 'OPEN';
