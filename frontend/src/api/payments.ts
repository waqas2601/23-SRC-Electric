import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function getPaymentsAPI(
  token: string,
  params?: {
    invoiceId?: string;
    method?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.invoiceId) query.set("invoiceId", params.invoiceId);
  if (params?.method) query.set("method", params.method);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/payments?${query}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}

export async function addPaymentAPI(
  token: string,
  data: {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    method: "CASH" | "BANK" | "OTHER";
    reference?: string;
    notes?: string;
  },
) {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to add payment");
  }
  return res.json();
}

export async function deletePaymentAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to delete payment");
  return res.json();
}
