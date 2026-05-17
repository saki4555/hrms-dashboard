// src/features/attendance-management/leave-balance/queries.js

import { useQuery } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/leave-balance`;

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 5 * 60 * 1000,   // 5 min — balance doesn't change that often
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
};

const fetcher = async (url) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.data; // unwrap { success, data }
};

// ── All leave types balance for one employee ──────────────────────────────────
//
//  Usage:
//    const { data: balances, isLoading } = useLeaveBalance(employeeId);
//
//  Returns array:
//    [{ LEAVE_TYPE_ID, CODE, LEAVE_TYPE_NAME, ALLOCATED, USED, REMAINING, PENDING_DAYS, APPROVED_DAYS }]
//
export const useLeaveBalance = (employeeId, year = null) => {
  const url = year
    ? `${BASE}/${employeeId}?year=${year}`
    : `${BASE}/${employeeId}`;

  return useQuery({
    queryKey: ["leave-balance", employeeId, year],
    queryFn: () => fetcher(url),
    enabled: Boolean(employeeId),
    ...queryDefaults,
  });
};

// ── Single leave type balance — updates live as type is selected ──────────────
//
//  Usage:
//    const { data: balance, isLoading } = useLeaveBalanceByType(employeeId, leaveTypeId);
//
//  Returns single object:
//    { LEAVE_TYPE_ID, CODE, LEAVE_TYPE_NAME, ALLOCATED, USED, REMAINING }
//
export const useLeaveBalanceByType = (employeeId, leaveTypeId, year = null) => {
  const url = year
    ? `${BASE}/${employeeId}/type/${leaveTypeId}?year=${year}`
    : `${BASE}/${employeeId}/type/${leaveTypeId}`;

  return useQuery({
    queryKey: ["leave-balance", employeeId, "type", leaveTypeId, year],
    queryFn: () => fetcher(url),
    enabled: Boolean(employeeId) && Boolean(leaveTypeId),
    ...queryDefaults,
  });
};