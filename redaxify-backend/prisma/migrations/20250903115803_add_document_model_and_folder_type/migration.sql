-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'video';

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "customerNumber" INTEGER NOT NULL,
    "folderId" INTEGER,
    "documentName" TEXT NOT NULL,
    "documentSize" INTEGER NOT NULL,
    "documentLocation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerNumber_fkey" FOREIGN KEY ("customerNumber") REFERENCES "Users"("customerNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
