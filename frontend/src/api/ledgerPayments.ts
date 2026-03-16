import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

type ApiErrorShape = {
  message?: string;
  error?: {
    message?: string;
  };
};

async function getErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorShape;
    return data.error?.message || data.message || fallback;
  } catch {
    return fallback;
  }
}

export interface LedgerPaymentCustomer {
  _id: string;
  name: string;
  shop_name?: string;
}

export interface LedgerPayment {
  _id: string;
  customer_id: LedgerPaymentCustomer;
  payment_date: string;
  amount: number;
  method: "CASH" | "BANK" | "OTHER";
  notes?: string;
  created_at?: string;
}

export interface GetLedgerPaymentsResponse {
  items: LedgerPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLedgerPaymentsAPI(
  token: string,
  params?: {
    customerId?: string;
    method?: "CASH" | "BANK" | "OTHER";
    q?: string;
    page?: number;
    limit?: number;
  },
): Promise<GetLedgerPaymentsResponse> {
  const query = new URLSearchParams();
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.method) query.set("method", params.method);
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const res = await fetch(
    `${API_URL}/ledger-payments${queryString ? `?${queryString}` : ""}`,
    {
      headers: headers(token),
    },
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(res, "Failed to fetch ledger payments"),
    );
  }

  return res.json();
}

export async function createCustomerLedgerPaymentAPI(
  token: string,
  customerId: string,
  data: {
    amount: number;
    method: "CASH" | "BANK" | "OTHER";
    paymentDate?: string;
    notes?: string;
  },
): Promise<LedgerPayment> {
  const normalizedPaymentDate = data.paymentDate
    ? /^\d{4}-\d{2}-\d{2}$/.test(data.paymentDate)
      ? new Date(`${data.paymentDate}T00:00:00.000Z`).toISOString()
      : data.paymentDate
    : undefined;

  const res = await fetch(
    `${API_URL}/customers/${customerId}/ledger-payments`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        ...data,
        paymentDate: normalizedPaymentDate,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(res, "Failed to create ledger payment"),
    );
  }

  return res.json();
}

export async function getCustomerLedgerPaymentsAPI(
  token: string,
  customerId: string,
): Promise<LedgerPayment[]> {
  const res = await fetch(
    `${API_URL}/customers/${customerId}/ledger-payments`,
    {
      headers: headers(token),
    },
  );

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(res, "Failed to fetch customer ledger payments"),
    );
  }

  return res.json();
}

export async function deleteLedgerPaymentAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/ledger-payments/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });

  if (!res.ok) {
    throw new Error(
      await getErrorMessage(res, "Failed to delete ledger payment"),
    );
  }

  return res.json();
}
