import { useQuery } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/attendance`;

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

const fetcher = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

/** Build query string from params object — skips empty/null values */
const buildQS = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") qs.set(k, String(v));
  });
  return qs.toString();
};

// ── Attendance list (paginated + filtered) ────────────────────────────────────
export const useAttendance = (params) =>
  useQuery({
    queryKey: ["attendance", "list", params],
    queryFn:  async () => {
      const json = await fetcher(`${BASE}?${buildQS(params)}`);
      return json;
    },
    refetchOnMount: true,
    placeholderData: (prev) => prev,
    ...queryDefaults,
  });

// ── Summary stats (present / late / absent / early leave counts) ──────────────
export const useAttendanceSummary = (params) =>
  useQuery({
    queryKey: ["attendance", "summary", params],
    queryFn:  async () => {
      const json = await fetcher(`${BASE}/summary?${buildQS(params)}`);
      return json.data;
    },
    enabled: !!(params.date || (params.fromDate && params.toDate)),
    ...queryDefaults,
  });

// ── Raw ATT_LOG detail for a specific employee + date ─────────────────────────
export const useAttendanceDetail = (employeeId, date) =>
  useQuery({
    queryKey: ["attendance", "detail", employeeId, date],
    queryFn:  async () => {
      const json = await fetcher(`${BASE}/detail/${employeeId}/${date}`);
      return json.data;
    },
    enabled: !!employeeId && !!date,
    ...queryDefaults,
  });

// ── Export URL builder (used directly as <a href> — no react-query needed) ────
export const buildExportUrl = (format, params) =>
  `${BASE}/export/${format}?${buildQS(params)}`;