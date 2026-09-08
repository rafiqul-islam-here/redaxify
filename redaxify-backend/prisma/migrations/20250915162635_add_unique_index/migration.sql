/*
  Warnings:

  - A unique constraint covering the columns `[documentId,mode,matchType,textToBlur]` on the table `DocumentResult` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DocumentResult" ADD COLUMN     "matchType" TEXT,
ADD COLUMN     "mode" TEXT,
ADD COLUMN     "textToBlur" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentResult_documentId_mode_matchType_textToBlur_key" ON "DocumentResult"("documentId", "mode", "matchType", "textToBlur");
