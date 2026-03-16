import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface Customer {
  _id: string;
  name: string;
  shop_name?: string;
  address?: string;
  phone?: string;
  notes?: string;
  is_active: boolean;
  payment_status?: "clear" | "partial" | "unpaid" | "overdue";
  opening_balance?: number;
  opening_balance_set?: boolean;
}

export interface GetCustomersResponse {
  items: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export async function getCustomersAPI(
  token: string,
  params?: {
    q?: string;
    page?: number;
    limit?: number;
  },
): Promise<GetCustomersResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();

  const res = await fetch(
    `${API_URL}/customers${queryString ? `?${queryString}` : ""}`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to fetch customers"));
  }
  return res.json();
}

export async function addCustomerAPI(
  token: string,
  data: {
    name: string;
    shop_name?: string;
    address?: string;
    phone?: string;
    notes?: string;
  },
) {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to add customer"));
  }
  return res.json();
}

export async function updateCustomerAPI(
  token: string,
  id: string,
  data: {
    name?: string;
    shop_name?: string;
    address?: string;
    phone?: string;
    notes?: string;
    is_active?: boolean;
  },
) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to update customer"));
  }
  return res.json();
}

export async function getCustomerByIdAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to fetch customer"));
  }
  return res.json();
}

export async function deleteCustomerAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to delete customer"));
  }
  return res.json();
}

export async function setCustomerOpeningBalanceAPI(
  token: string,
  id: string,
  amount: number,
) {
  const res = await fetch(`${API_URL}/customers/${id}/opening-balance`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    throw new Error(
      await getErrorMessage(res, "Failed to set opening balance"),
    );
  }
  return res.json();
}
