import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth`;
const API_BASE = '/api/v1/auth';

// ── Fetchers ──────────────────────────────────────────────────────────────────

const fetchCurrentUser = async () => {
  const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data.user ?? null; 
};

const loginUser = async ({ username, password }) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  return res.json(); // { status, data: { user, token } }
};

const logoutUser = async () => {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
};

// ── Query Keys ────────────────────────────────────────────────────────────────

export const authKeys = {
  user: ["authUser"],
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useCurrentUser = () =>
  useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user, data.data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user, null);
    },
  });
};