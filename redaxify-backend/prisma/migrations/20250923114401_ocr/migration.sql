-- CreateTable
CREATE TABLE "DocumentOCR" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "targetText" TEXT,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentOCR_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentOCR_documentId_mode_key" ON "DocumentOCR"("documentId", "mode");

-- AddForeignKey
ALTER TABLE "DocumentOCR" ADD CONSTRAINT "DocumentOCR_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
