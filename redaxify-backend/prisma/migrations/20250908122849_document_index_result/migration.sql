/*
  Warnings:

  - You are about to drop the column `indexerDocumentId` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "indexerDocumentId",
ADD COLUMN     "indexedAt" TIMESTAMP(3),
ADD COLUMN     "indexingResults" JSONB;
