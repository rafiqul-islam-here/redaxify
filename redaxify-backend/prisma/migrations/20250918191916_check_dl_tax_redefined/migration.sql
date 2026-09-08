-- AlterTable
ALTER TABLE "BankStatementResult" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "DrivingLicenseResult" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "USCheckResult" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "USTaxResult" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT;
