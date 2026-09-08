-- CreateTable
CREATE TABLE "DemoWorkspaceAsset" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "DemoWorkspaceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoWorkspaceAsset_workspaceId_fileKey_key" ON "DemoWorkspaceAsset"("workspaceId", "fileKey");

-- AddForeignKey
ALTER TABLE "DemoWorkspaceAsset" ADD CONSTRAINT "DemoWorkspaceAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "DemoWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
