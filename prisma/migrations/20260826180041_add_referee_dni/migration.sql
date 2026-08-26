/*
  Warnings:

  - Added the required column `dni` to the `Referee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Referee" ADD COLUMN     "dni" TEXT NOT NULL;
