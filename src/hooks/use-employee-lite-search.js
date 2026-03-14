import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-employee-lite`;

const searchEmployeesLite = async (searchTerm) => {
  const res = await fetch(`${API_BASE_URL}?q=${encodeURIComponent(searchTerm)}`);
  if (!res.ok) throw new Error(`Failed to search employees: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

// Debounce hook
export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// Employee lite search hook
export const useEmployeeLiteSearch = (searchTerm) => {
  const debouncedTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ["employee-lite", debouncedTerm],
    queryFn: () => searchEmployeesLite(debouncedTerm),
    enabled: debouncedTerm.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
    placeholderData: [],
  });
};