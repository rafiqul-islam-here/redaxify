/*
  Warnings:

  - You are about to drop the `USTaxResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REQUIRES_REVIEW');

-- DropForeignKey
ALTER TABLE "USTaxResult" DROP CONSTRAINT "USTaxResult_documentId_fkey";

-- DropTable
DROP TABLE "USTaxResult";

-- CreateTable
CREATE TABLE "us_tax_results" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "taxFormType" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "extractedData" JSONB,

    CONSTRAINT "us_tax_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "us_tax_results_documentId_key" ON "us_tax_results"("documentId");

-- AddForeignKey
ALTER TABLE "us_tax_results" ADD CONSTRAINT "us_tax_results_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
