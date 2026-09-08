/*
  Warnings:

  - You are about to drop the column `indexedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `indexingStatus` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the `DocumentResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DocumentResult" DROP CONSTRAINT "DocumentResult_documentId_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "indexedAt",
DROP COLUMN "indexingStatus";

-- DropTable
DROP TABLE "DocumentResult";

-- CreateTable
CREATE TABLE "BankStatementResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "accountHolder" TEXT,
    "accountAddress" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "statementStart" TIMESTAMP(3),
    "statementEnd" TIMESTAMP(3),
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankStatementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "bankStatementId" INTEGER NOT NULL,
    "accountNumber" TEXT,
    "accountType" TEXT,
    "beginningBalance" DOUBLE PRECISION,
    "endingBalance" DOUBLE PRECISION,
    "totalServiceFees" DOUBLE PRECISION,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" SERIAL NOT NULL,
    "bankAccountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "description" TEXT,
    "depositAmount" DOUBLE PRECISION,
    "withdrawalAmount" DOUBLE PRECISION,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementResult_documentId_key" ON "BankStatementResult"("documentId");

-- AddForeignKey
ALTER TABLE "BankStatementResult" ADD CONSTRAINT "BankStatementResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES "BankStatementResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
