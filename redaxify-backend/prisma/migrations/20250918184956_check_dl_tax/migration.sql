-- CreateTable
CREATE TABLE "USTaxResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "taxpayerName" TEXT,
    "taxpayerSSN" TEXT,
    "taxYear" INTEGER,
    "totalIncome" DOUBLE PRECISION,
    "totalTax" DOUBLE PRECISION,
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "USTaxResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivingLicenseResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "licenseNumber" TEXT,
    "address" TEXT,
    "expiryDate" TIMESTAMP(3),
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrivingLicenseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USCheckResult" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "payerName" TEXT,
    "payerAccount" TEXT,
    "payeeName" TEXT,
    "payeeAccount" TEXT,
    "checkNumber" TEXT,
    "routingNumber" TEXT,
    "amount" DOUBLE PRECISION,
    "dateIssued" TIMESTAMP(3),
    "rawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "USCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USTaxResult_documentId_key" ON "USTaxResult"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DrivingLicenseResult_documentId_key" ON "DrivingLicenseResult"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "USCheckResult_documentId_key" ON "USCheckResult"("documentId");

-- AddForeignKey
ALTER TABLE "USTaxResult" ADD CONSTRAINT "USTaxResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingLicenseResult" ADD CONSTRAINT "DrivingLicenseResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USCheckResult" ADD CONSTRAINT "USCheckResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
