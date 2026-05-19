// src/features/dashboard/queries.js
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/features/authentication-v2/queries";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/dashboard`;

const fetcher = async (url) => {
  const token = getToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/summary`);
      return json.data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  });