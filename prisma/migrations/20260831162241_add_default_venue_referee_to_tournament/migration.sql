-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "defaultRefereeId" TEXT,
ADD COLUMN     "defaultVenueId" TEXT;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_defaultVenueId_fkey" FOREIGN KEY ("defaultVenueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_defaultRefereeId_fkey" FOREIGN KEY ("defaultRefereeId") REFERENCES "Referee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
