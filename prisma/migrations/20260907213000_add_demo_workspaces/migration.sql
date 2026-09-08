-- CreateTable
CREATE TABLE "DemoWorkspace" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "templateTournamentId" TEXT NOT NULL,

    CONSTRAINT "DemoWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoWorkspace_userId_templateTournamentId_key" ON "DemoWorkspace"("userId", "templateTournamentId");

-- CreateIndex
CREATE INDEX "DemoWorkspace_expiresAt_idx" ON "DemoWorkspace"("expiresAt");

-- AddForeignKey
ALTER TABLE "DemoWorkspace" ADD CONSTRAINT "DemoWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoWorkspace" ADD CONSTRAINT "DemoWorkspace_templateTournamentId_fkey" FOREIGN KEY ("templateTournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
