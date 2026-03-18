import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function getInvoicesAPI(
  token: string,
  params?: {
    q?: string;

    status?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);

  if (params?.status) query.set("status", params.status);
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/invoices?${query}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function getInvoiceByIdAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/invoices/${id}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch invoice");
  return res.json();
}

export async function addInvoiceAPI(
  token: string,
  data: {
    customerId: string;
    invoiceDate?: string;
    discount?: number;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
      unitPriceSnapshot: number;
      boxQty?: number;
    }[];
  },
) {
  const res = await fetch(`${API_URL}/invoices`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to create invoice");
  }
  return res.json();
}

export async function updateInvoiceAPI(
  token: string,
  id: string,
  data: {
    invoiceDate?: string;
    discount?: number;
    notes?: string;
    items?: {
      productId: string;
      quantity: number;
      unitPriceSnapshot: number;
      boxQty?: number;
    }[];
  },
) {
  const res = await fetch(`${API_URL}/invoices/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = "Failed to update invoice";
    try {
      const err = await res.json();
      message = err?.error?.message || err?.message || message;
    } catch {
      // fallback message above
    }
    throw new Error(message);
  }
  return res.json();
}

export async function deleteInvoiceAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/invoices/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to delete invoice");
  return res.json();
}

export async function appendInvoiceItemsAPI(
  token: string,
  id: string,
  data: {
    items: {
      productId: string;
      quantity: number;
      unitPriceSnapshot?: number;
      boxQty?: number;
    }[];
  },
) {
  const res = await fetch(`${API_URL}/invoices/${id}/items`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = "Failed to append invoice items";
    try {
      const err = await res.json();
      message = err?.error?.message || err?.message || message;
    } catch {
      // fallback message above
    }
    throw new Error(message);
  }
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
