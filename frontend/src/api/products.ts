import API_URL from "../config/api";

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface Product {
  _id: string;
  name: string;
  type: "direct" | "model";
  model?: string | null;
  price: number;
  sku: string;
}

interface ProductModelItem {
  _id: string;
  label: string;
  sku_prefix: string;
}


export interface GetProductsResponse {
  items: Product[];
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

export async function getProductModelsAPI(token: string) {
  const res = await fetch(`${API_URL}/product-models`, {
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to fetch models"));
  }
  const data = (await res.json()) as { items?: ProductModelItem[] };
  const labels = Array.from(
    new Set((data.items ?? []).map((m) => m.label.trim()).filter(Boolean)),
  );
  return {
    items: data.items ?? [],
    models: labels,
  };
}

export async function getProductsAPI(
  token: string,
  params?: {
    q?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  },
): Promise<GetProductsResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.isActive !== undefined)
    query.set("isActive", String(params.isActive));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();

  const res = await fetch(
    `${API_URL}/products${queryString ? `?${queryString}` : ""}`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to fetch products"));
  }
  return res.json();
}

export async function addProductAPI(
  token: string,
  data: {
    type: "direct" | "model";
    name: string;
    model?: string;
    price: number;
    sku?: string;
  },
) {
  const payload = {
    type: data.type,
    name: data.name,
    ...(data.type === "model" && data.model ? { model: data.model } : {}),
    price: data.price,
    ...(data.sku ? { sku: data.sku } : {}),
  };

  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to add product"));
  }
  return res.json();
}

export async function updateProductAPI(
  token: string,
  id: string,
  data: {
    name?: string;
    model?: string;
    price?: number;
    sku?: string;
  },
) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to update product"));
  }
  return res.json();
}

export async function deleteProductAPI(token: string, id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to delete product"));
  }
  return res.json();
}
