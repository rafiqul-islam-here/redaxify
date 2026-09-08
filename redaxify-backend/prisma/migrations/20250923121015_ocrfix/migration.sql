/*
  Warnings:

  - You are about to drop the `DocumentOCR` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DocumentOCR" DROP CONSTRAINT "DocumentOCR_documentId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "indexedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "DocumentOCR";

-- CreateTable
CREATE TABLE "DocumentResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "mode" TEXT,
    "matchType" TEXT,
    "textToBlur" TEXT,
    "rawResponse" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentResult_documentId_mode_matchType_textToBlur_key" ON "DocumentResult"("documentId", "mode", "matchType", "textToBlur");

-- AddForeignKey
ALTER TABLE "DocumentResult" ADD CONSTRAINT "DocumentResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
