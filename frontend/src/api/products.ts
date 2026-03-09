import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function getProductsAPI(
  token: string,
  params?: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  },
) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category) query.set("category", params.category);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.isActive !== undefined)
    query.set("isActive", String(params.isActive));

  const res = await fetch(`${API_URL}/products?${query}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function addProductAPI(
  token: string,
  data: {
    name: string;
    category: string;
    price: number;
  },
) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add product");
  return res.json();
}

export async function updateProductAPI(
  token: string,
  id: string,
  data: {
    name?: string;
    category?: string;
    price?: number;
    is_active?: boolean;
  },
) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
}

export async function deleteProductAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
}
