import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function getCustomersAPI(
  token: string,
  params?: {
    q?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/customers?${query}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch customers");
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
  if (!res.ok) throw new Error("Failed to add customer");
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
  if (!res.ok) throw new Error("Failed to update customer");
  return res.json();
}

export async function deleteCustomerAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to delete customer");
  return res.json();
}
