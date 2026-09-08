"use client";
import React from "react";
import CopyButton from "./ui/CopyButton";

interface AddressValue {
    city?: string;
    road?: string;
    state?: string;
    postalCode?: string;
    houseNumber?: string;
    streetAddress?: string;
}

interface InvoiceResponse {
    fields: {
        [key: string]: any;
        Items?: {
            kind: "array";
            values: {
                kind: "object";
                properties: {
                    Date?: { value: string };
                    ProductCode?: { value: string };
                    Description?: { value: string };
                    Quantity?: { value: number };
                    Unit?: { value: string };
                    UnitPrice?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
                    Tax?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
                    Amount?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
                };
            }[];
        };
        DueDate?: { value: string };
        InvoiceDate?: { value: string };
        InvoiceId?: { value: string };
        CustomerId?: { value: string };
        VendorName?: { value: string };
        CustomerName?: { value: string };
        SubTotal?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
        TotalTax?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
        InvoiceTotal?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
        AmountDue?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
        PreviousUnpaidBalance?: { value: { amount: number; currencyCode?: string; currencySymbol?: string } };
        PurchaseOrder?: { value: string };
        VendorAddress?: { value: AddressValue };
        BillingAddress?: { value: AddressValue };
        ServiceAddress?: { value: AddressValue };
        CustomerAddress?: { value: AddressValue };
        ShippingAddress?: { value: AddressValue };
        RemittanceAddress?: { value: AddressValue };
        VendorAddressRecipient?: { value: string };
        BillingAddressRecipient?: { value: string };
        ServiceAddressRecipient?: { value: string };
        CustomerAddressRecipient?: { value: string };
        ShippingAddressRecipient?: { value: string };
        RemittanceAddressRecipient?: { value: string };
        ServiceStartDate?: { value: string };
        ServiceEndDate?: { value: string };
    };
}

function formatDate(dateString?: string) {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}

function formatCurrency(val?: { amount: number; currencySymbol?: string; currencyCode?: string }) {
    if (!val) return "";
    return `${val.currencySymbol ?? ""}${val.amount.toFixed(2)}`;
}

function addressToText(recipient?: string, address?: AddressValue): string {
    const out: string[] = [];
    if (recipient) out.push(recipient);
    if (address?.streetAddress) out.push(address.streetAddress);
    if (address?.city || address?.state || address?.postalCode) {
        out.push(
            [address?.city, address?.state ? address.state : undefined, address?.postalCode]
                .filter(Boolean)
                .join(", ")
        );
    }
    return out.filter(Boolean).join("\n");
}

function getStructuredText(f: InvoiceResponse["fields"]): string {
    const lines: string[] = [];
    if (f.VendorName?.value) lines.push(`Vendor Name: ${f.VendorName.value}`);
    if (f.CustomerName?.value) lines.push(`Customer Name: ${f.CustomerName.value}`);
    if (f.InvoiceId?.value) lines.push(`Invoice #: ${f.InvoiceId.value}`);
    if (f.CustomerId?.value) lines.push(`Customer ID: ${f.CustomerId.value}`);
    if (f.InvoiceDate?.value) lines.push(`Invoice Date: ${formatDate(f.InvoiceDate.value)}`);
    if (f.DueDate?.value) lines.push(`Due Date: ${formatDate(f.DueDate.value)}`);
    if (f.PurchaseOrder?.value) lines.push(`Purchase Order: ${f.PurchaseOrder.value}`);
    if (f.ServiceStartDate?.value || f.ServiceEndDate?.value)
        lines.push(
            `Service Period: ${formatDate(f.ServiceStartDate?.value)} - ${formatDate(f.ServiceEndDate?.value)}`
        );
    if (f.VendorAddress?.value || f.VendorAddressRecipient?.value)
        lines.push(`Vendor Address:\n${addressToText(f.VendorAddressRecipient?.value, f.VendorAddress?.value)}`);
    if (f.CustomerAddress?.value || f.CustomerAddressRecipient?.value)
        lines.push(`Customer Address:\n${addressToText(f.CustomerAddressRecipient?.value, f.CustomerAddress?.value)}`);
    if (f.BillingAddress?.value || f.BillingAddressRecipient?.value)
        lines.push(`Billing Address:\n${addressToText(f.BillingAddressRecipient?.value, f.BillingAddress?.value)}`);
    if (f.ShippingAddress?.value || f.ShippingAddressRecipient?.value)
        lines.push(`Shipping Address:\n${addressToText(f.ShippingAddressRecipient?.value, f.ShippingAddress?.value)}`);
    if (f.ServiceAddress?.value || f.ServiceAddressRecipient?.value)
        lines.push(`Service Address:\n${addressToText(f.ServiceAddressRecipient?.value, f.ServiceAddress?.value)}`);
    if (f.RemittanceAddress?.value || f.RemittanceAddressRecipient?.value)
        lines.push(`Remittance Address:\n${addressToText(f.RemittanceAddressRecipient?.value, f.RemittanceAddress?.value)}`);
    if (f.Items?.values?.length) {
        lines.push("Invoice Items:");
        f.Items.values.forEach((item: any) => {
            const p = item.properties || {};
            lines.push(
                `  - ${formatDate(p.Date?.value)} | Product Code: ${p.ProductCode?.value} | Desc: ${p.Description?.value} | Qty: ${p.Quantity?.value} | Unit: ${p.Unit?.value} | Unit Price: ${formatCurrency(p.UnitPrice?.value)} | Tax: ${formatCurrency(p.Tax?.value)} | Amount: ${formatCurrency(p.Amount?.value)}`
            );
        });
    }
    if (f.SubTotal?.value) lines.push(`Sub Total: ${formatCurrency(f.SubTotal.value)}`);
    if (f.TotalTax?.value) lines.push(`Total Tax: ${formatCurrency(f.TotalTax.value)}`);
    if (f.PreviousUnpaidBalance?.value)
        lines.push(`Previous Unpaid Balance: ${formatCurrency(f.PreviousUnpaidBalance.value)}`);
    if (f.InvoiceTotal?.value) lines.push(`Invoice Total: ${formatCurrency(f.InvoiceTotal.value)}`);
    if (f.AmountDue?.value) lines.push(`Amount Due: ${formatCurrency(f.AmountDue.value)}`);
    return lines.join("\n");
}

const AddressBlock: React.FC<{
    title: string;
    value?: AddressValue;
    recipient?: string;
}> = ({ title, value, recipient }) => {
    if (!value && !recipient) return null;
    const text = addressToText(recipient, value);
    return (
        <div className="mb-2 bg-[#191936] p-3 rounded relative min-w-[200px] max-w-[300px]">
            <h4 className="font-semibold text-sm text-gray-200">{title}</h4>
            <div className="flex flex-col gap-1 text-xs text-gray-400 whitespace-pre-line">
                {recipient && <div>{recipient}</div>}
                {value?.streetAddress && <div>{value.streetAddress}</div>}
                {(value?.city || value?.state || value?.postalCode) && (
                    <div>
                        {value.city && value.city}, {value.state && value.state} {value.postalCode && value.postalCode}
                    </div>
                )}
            </div>
            <div className="absolute top-2 right-2">
                <CopyButton text={text} />
            </div>
        </div>
    );
};

const InvoiceDetails: React.FC<{ response: InvoiceResponse }> = ({ response }) => {
    const f = response.fields;

    const items =
        f.Items?.values?.map((item: any) => {
            const p = item.properties || {};
            return {
                Date: formatDate(p.Date?.value),
                ProductCode: p.ProductCode?.value,
                Description: p.Description?.value,
                Quantity: p.Quantity?.value,
                Unit: p.Unit?.value,
                UnitPrice: formatCurrency(p.UnitPrice?.value),
                Tax: formatCurrency(p.Tax?.value),
                Amount: formatCurrency(p.Amount?.value),
            };
        }) ?? [];

    const mainFields = [
        { key: "InvoiceId", label: "Invoice #" },
        { key: "CustomerId", label: "Customer ID" },
        { key: "InvoiceDate", label: "Invoice Date", format: formatDate },
        { key: "DueDate", label: "Due Date", format: formatDate },
        { key: "PurchaseOrder", label: "Purchase Order" },
        { key: "ServiceStartDate", label: "Service Start Date", format: formatDate },
        { key: "ServiceEndDate", label: "Service End Date", format: formatDate },
        { key: "VendorName", label: "Vendor Name" },
        { key: "CustomerName", label: "Customer Name" },
        { key: "SubTotal", label: "Sub Total", format: (v: any) => formatCurrency(v?.value) },
        { key: "TotalTax", label: "Total Tax", format: (v: any) => formatCurrency(v?.value) },
        { key: "PreviousUnpaidBalance", label: "Previous Unpaid Balance", format: (v: any) => formatCurrency(v?.value) },
        { key: "InvoiceTotal", label: "Invoice Total", format: (v: any) => formatCurrency(v?.value) },
        { key: "AmountDue", label: "Amount Due", format: (v: any) => formatCurrency(v?.value) },
    ];

    const addressFields = [
        { key: "VendorAddress", recipientKey: "VendorAddressRecipient", label: "Vendor Address" },
        { key: "CustomerAddress", recipientKey: "CustomerAddressRecipient", label: "Customer Address" },
        { key: "BillingAddress", recipientKey: "BillingAddressRecipient", label: "Billing Address" },
        { key: "ShippingAddress", recipientKey: "ShippingAddressRecipient", label: "Shipping Address" },
        { key: "ServiceAddress", recipientKey: "ServiceAddressRecipient", label: "Service Address" },
        { key: "RemittanceAddress", recipientKey: "RemittanceAddressRecipient", label: "Remittance Address" },
    ];

    return (
        <div className="bg-[#23234a] rounded-lg p-6 shadow flex flex-col gap-6">
            <div className="flex justify-end mb-2">
                <CopyButton
                    text={getStructuredText(f)}
                    className="px-3 py-2 text-sm flex items-center gap-2"
                    label="Copy All"
                />
            </div>

            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="text-lg font-bold text-white mb-2">{f.VendorName?.value}</div>
                    <AddressBlock
                        title="Vendor Address"
                        value={f.VendorAddress?.value}
                        recipient={f.VendorAddressRecipient?.value}
                    />
                </div>
                <div>
                    <div className="text-lg font-bold text-white mb-2">{f.CustomerName?.value}</div>
                    <AddressBlock
                        title="Customer Address"
                        value={f.CustomerAddress?.value}
                        recipient={f.CustomerAddressRecipient?.value}
                    />
                </div>
            </div>

            {/* Individually copy-able fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {mainFields.map(({ key, label, format }) =>
                    f[key] ? (
                        <div key={key} className="bg-[#191936] p-3 rounded flex flex-col gap-2 relative min-w-[200px] max-w-[300px]">
                            <span className="text-gray-400 text-sm">{label}</span>
                            <span className="font-medium text-white break-words">
                                {format ? format(f[key]) : f[key]?.value}
                            </span>
                            <div className="absolute top-2 right-2">
                                <CopyButton text={format ? format(f[key]) : f[key]?.value} />
                            </div>
                        </div>
                    ) : null
                )}
            </div>

            {/* Address blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {addressFields.map(({ key, recipientKey, label }) => (
                    <AddressBlock
                        key={key}
                        title={label}
                        value={f[key]?.value}
                        recipient={f[recipientKey]?.value}
                    />
                ))}
            </div>

            {/* Items Table */}
            <div>
                <h3 className="text-white text-lg font-semibold mb-2">Invoice Items</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm bg-[#191936] rounded border border-gray-700">
                        <thead>
                            <tr className="bg-[#23234a] text-gray-300">
                                <th className="p-2">Date</th>
                                <th className="p-2">Product Code</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Quantity</th>
                                <th className="p-2">Unit</th>
                                <th className="p-2">Unit Price</th>
                                <th className="p-2">Tax</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Copy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-t border-gray-600 text-white">
                                    <td className="p-2">{item.Date}</td>
                                    <td className="p-2">{item.ProductCode}</td>
                                    <td className="p-2">{item.Description}</td>
                                    <td className="p-2">{item.Quantity}</td>
                                    <td className="p-2">{item.Unit}</td>
                                    <td className="p-2">{item.UnitPrice}</td>
                                    <td className="p-2">{item.Tax}</td>
                                    <td className="p-2">{item.Amount}</td>
                                    <td className="p-2">
                                        <CopyButton
                                            text={`Date: ${item.Date} | Product Code: ${item.ProductCode} | Desc: ${item.Description} | Qty: ${item.Quantity} | Unit: ${item.Unit} | Unit Price: ${item.UnitPrice} | Tax: ${item.Tax} | Amount: ${item.Amount}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
