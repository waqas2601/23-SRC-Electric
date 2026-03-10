import API_URL from "../config/api";

export async function getSummaryAPI(
  token: string,
  params?: {
    fromDate?: string;
    toDate?: string;
    overdueDays?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.overdueDays) query.set("overdueDays", String(params.overdueDays));

  const res = await fetch(`${API_URL}/summary/dashboard?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
