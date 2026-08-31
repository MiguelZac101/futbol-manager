-- AlterTable: add nullable slug first
ALTER TABLE "Tournament" ADD COLUMN "slug" TEXT;

-- Backfill existing rows with a slug derived from the id (guaranteed unique)
UPDATE "Tournament" SET "slug" = lower("id") WHERE "slug" IS NULL;

-- Enforce NOT NULL now that all rows have a value
ALTER TABLE "Tournament" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");
