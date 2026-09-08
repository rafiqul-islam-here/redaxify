/*
  Warnings:

  - You are about to drop the column `indexingResults` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "indexingResults";

-- CreateTable
CREATE TABLE "DocumentResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentResult" ADD CONSTRAINT "DocumentResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
