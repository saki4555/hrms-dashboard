// src/features/authentication-v2/queries.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v2/auth`;

// ── Token helpers ─────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem("hrms_token");
export const setToken = (token) => localStorage.setItem("hrms_token", token);
export const removeToken = () => localStorage.removeItem("hrms_token");

// ── Fetchers ──────────────────────────────────────────────────────────────────

const fetchCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    removeToken(); // token expired or invalid — clear it
    return null;
  }

  const json = await res.json();
  return json.data.user ?? null;
};

const loginUser = async ({ username, password }) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }

  const json = await res.json(); // { status, data: { user, token } }
  setToken(json.data.token);     // store token immediately
  return json;
};

const logoutUser = async () => {
  const token = getToken();
  if (token) {
    // Optional — tells the server (for audit logs etc.), fire-and-forget
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  removeToken();
};

// ── Query Keys ────────────────────────────────────────────────────────────────

export const authKeysV2 = {
  user: ["authUserV2"],
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useCurrentUserV2 = () =>
  useQuery({
    queryKey: authKeysV2.user,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

export const useLoginV2 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeysV2.user, data.data.user);
    },
  });
};

export const useLogoutV2 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(authKeysV2.user, null);
    },
  });
};