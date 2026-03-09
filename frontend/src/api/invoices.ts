import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function getInvoicesAPI(
  token: string,
  params?: {
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/invoices?${query}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function addInvoiceAPI(
  token: string,
  data: {
    invoiceNo?: string;
    customerId: string;
    invoiceDate: string;
    discount?: number;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
      unitPriceSnapshot: number;
    }[];
  },
) {
  const res = await fetch(`${API_URL}/invoices`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create invoice");
  return res.json();
}

export async function getInvoiceByIdAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/invoices/${id}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch invoice");
  return res.json();
}

export async function addPaymentToInvoiceAPI(
  token: string,
  invoiceId: string,
  data: {
    paymentDate: string;
    amount: number;
    method: "CASH" | "BANK" | "OTHER";
    reference?: string;
    notes?: string;
  },
) {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add payment");
  return res.json();
}

export async function getInvoicePaymentsAPI(token: string, invoiceId: string) {
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}
