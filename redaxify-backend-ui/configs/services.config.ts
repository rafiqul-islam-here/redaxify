// configs/services.config.ts

export const AZURE_SERVICES: Record<
    string,
    { label: string; modelId: string }
> = {
    document: { label: "General Document", modelId: "prebuilt-document" },
    layout: { label: "Layout", modelId: "prebuilt-layout" },
    read: { label: "Read (OCR)", modelId: "prebuilt-read" },
    invoice: { label: "Invoice", modelId: "prebuilt-invoice" },
    receipt: { label: "Receipt", modelId: "prebuilt-receipt" },
    businessCard: { label: "Business Card", modelId: "prebuilt-businessCard" },
    idDocument: { label: "ID Document", modelId: "prebuilt-idDocument" },
    healthInsuranceCard: { label: "Health Insurance Card (US)", modelId: "prebuilt-healthInsuranceCard.us" },
    taxW2: { label: "US Tax W2", modelId: "prebuilt-tax.us.w2" },
    bankStatement: { label: "Bank Statement", modelId: "prebuilt-bankStatement" },
    payStub: { label: "Pay Stub", modelId: "prebuilt-payStub" },
    check: { label: "Check", modelId: "prebuilt-check" },
    mortgage: { label: "Mortgage", modelId: "prebuilt-mortgage" },
    contract: { label: "Contract", modelId: "prebuilt-contract" },
    creditCard: { label: "Credit Card", modelId: "prebuilt-creditCard" },
    marriageCertificate: { label: "Marriage Certificate", modelId: "prebuilt-marriageCertificate" },
};
