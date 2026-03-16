export const INVOICE_STATUS = ["unpaid", "partial", "completed"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[number];
