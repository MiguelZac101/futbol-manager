-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "isDemoSandbox" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DemoWorkspace" ADD COLUMN "sandboxTournamentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DemoWorkspace_sandboxTournamentId_key" ON "DemoWorkspace"("sandboxTournamentId");

-- AddForeignKey
ALTER TABLE "DemoWorkspace" ADD CONSTRAINT "DemoWorkspace_sandboxTournamentId_fkey" FOREIGN KEY ("sandboxTournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
