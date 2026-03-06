// location-lookup-queries.js
import { useQuery } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/locations`;
// ─── Query Keys ───────────────────────────────────────────────────────────────
const locationLookupKeys = {
  all: ["lookup"],
  countries: () => [...locationLookupKeys.all, "countries"],
  regions: (countryId) => [...locationLookupKeys.all, "regions", countryId],
  districts: (regionId) => [...locationLookupKeys.all, "districts", regionId],
  upazillas: (districtId) => [
    ...locationLookupKeys.all,
    "upazillas",
    districtId,
  ],
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useCountriesLookup = () =>
  useQuery({
    queryKey: locationLookupKeys.countries(),
    queryFn: () => fetchJson(`${BASE}/countries`),
    staleTime: 10 * 60 * 1000,
  });

export const useRegionsLookup = (countryId) =>
  useQuery({
    queryKey: locationLookupKeys.regions(countryId),
    queryFn: () => fetchJson(`${BASE}/region/${countryId}`),
    enabled: !!countryId,
    staleTime: 10 * 60 * 1000,
  });

export const useDistrictsLookup = (regionId) =>
  useQuery({
    queryKey: locationLookupKeys.districts(regionId),
    queryFn: () => fetchJson(`${BASE}/district/${regionId}`),
    enabled: !!regionId,
    staleTime: 10 * 60 * 1000,
  });

export const useUpazillasLookup = (districtId) =>
  useQuery({
    queryKey: locationLookupKeys.upazillas(districtId),
    queryFn: () => fetchJson(`${BASE}/upazilla/${districtId}`),
    enabled: !!districtId,
    staleTime: 10 * 60 * 1000,
  });
