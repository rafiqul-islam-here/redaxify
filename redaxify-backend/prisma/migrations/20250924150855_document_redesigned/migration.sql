/*
  Warnings:

  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankStatementResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DrivingLicenseResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `USCheckResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_bankStatementId_fkey";

-- DropForeignKey
ALTER TABLE "BankStatementResult" DROP CONSTRAINT "BankStatementResult_documentId_fkey";

-- DropForeignKey
ALTER TABLE "BankTransaction" DROP CONSTRAINT "BankTransaction_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "DrivingLicenseResult" DROP CONSTRAINT "DrivingLicenseResult_documentId_fkey";

-- DropForeignKey
ALTER TABLE "USCheckResult" DROP CONSTRAINT "USCheckResult_documentId_fkey";

-- DropTable
DROP TABLE "BankAccount";

-- DropTable
DROP TABLE "BankStatementResult";

-- DropTable
DROP TABLE "BankTransaction";

-- DropTable
DROP TABLE "DrivingLicenseResult";

-- DropTable
DROP TABLE "USCheckResult";

-- CreateTable
CREATE TABLE "DocumentAnalysisResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentAnalysisResult" ADD CONSTRAINT "DocumentAnalysisResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
