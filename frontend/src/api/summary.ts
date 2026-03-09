import API_URL from "../config/api";

export async function getSummaryAPI(token: string) {
  const res = await fetch(`${API_URL}/summary/receivables`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
