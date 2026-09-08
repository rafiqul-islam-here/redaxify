/*
  Warnings:

  - You are about to drop the column `extractedData` on the `us_tax_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "us_tax_results" DROP COLUMN "extractedData";

-- CreateTable
CREATE TABLE "w2_results" (
    "id" SERIAL NOT NULL,
    "usTaxResultId" INTEGER NOT NULL,
    "employeeName" TEXT,
    "employeeSSN" TEXT,
    "wagesTipsOtherCompensation" DOUBLE PRECISION,
    "federalIncomeTaxWithheld" DOUBLE PRECISION,
    "socialSecurityWages" DOUBLE PRECISION,
    "socialSecurityTaxWithheld" DOUBLE PRECISION,
    "medicareWagesAndTips" DOUBLE PRECISION,
    "medicareTaxWithheld" DOUBLE PRECISION,
    "isStatutoryEmployee" BOOLEAN,
    "isRetirementPlan" BOOLEAN,
    "isThirdPartySickPay" BOOLEAN,
    "controlNumber" TEXT,
    "stateTaxInfos" JSONB,
    "w2Copy" TEXT,
    "w2FormVariant" TEXT,

    CONSTRAINT "w2_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "w2_results_usTaxResultId_key" ON "w2_results"("usTaxResultId");

-- AddForeignKey
ALTER TABLE "w2_results" ADD CONSTRAINT "w2_results_usTaxResultId_fkey" FOREIGN KEY ("usTaxResultId") REFERENCES "us_tax_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
