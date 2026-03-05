
// src\features\core-hr\employee-management\location-lookup-queries.js
import { useQuery } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/locations`;

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

export const useCountries = () =>
  useQuery({
    queryKey: ["countries"],
    queryFn: () => fetchJson(`${BASE}/countries`),
    staleTime: 10 * 60 * 1000, // stable data, cache 10 min
  });

export const useRegions = (countryId) =>
  useQuery({
    queryKey: ["region", countryId],
    queryFn: () => fetchJson(`${BASE}/region/${countryId}`),
    enabled: !!countryId,
    staleTime: 10 * 60 * 1000,
  });

export const useDistricts = (regionId) =>
  useQuery({
    queryKey: ["district", regionId],
    queryFn: () => fetchJson(`${BASE}/district/${regionId}`),
    enabled: !!regionId,
    staleTime: 10 * 60 * 1000,
  });

export const useUpazillas = (districtId) =>
  useQuery({
    queryKey: ["upazilla", districtId],
    queryFn: () => fetchJson(`${BASE}/upazilla/${districtId}`),
    enabled: !!districtId,
    staleTime: 10 * 60 * 1000,
  });