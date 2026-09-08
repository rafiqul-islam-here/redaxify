/*
  Warnings:

  - You are about to drop the `us_tax_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `w2_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "us_tax_results" DROP CONSTRAINT "us_tax_results_documentId_fkey";

-- DropForeignKey
ALTER TABLE "w2_results" DROP CONSTRAINT "w2_results_usTaxResultId_fkey";

-- DropTable
DROP TABLE "us_tax_results";

-- DropTable
DROP TABLE "w2_results";

-- DropEnum
DROP TYPE "ProcessingStatus";
