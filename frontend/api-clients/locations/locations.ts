import { useState, useEffect } from "react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface Location {
  id: string;
  name?: string;
  userId?: string;
  addressLine?: string;
  city?: string;
  governorate?: string;
  country?: string;
  postalCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  isPrimary?: boolean;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface PageInfo {
  totalRecords: number;
}

export interface PaginatedResponse<T> {
  resultData: T[];
  pageInfo: PageInfo[];
}

export function useLocations(accessToken?: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const size = 10;

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("s", search);

        const data = await apiFetchJson<PaginatedResponse<Location>>(
          `/api/locations/${String(page)}/${String(size)}/en?${queryParams.toString()}`,
          {
            accessToken,
          }
        );

        if (isMounted) {
          setLocations(data.resultData);
          const totalRecords = data.pageInfo[0].totalRecords;
          setTotalPages(Math.max(1, Math.ceil(totalRecords / size)));
        }
      } catch (err) {
        logger.error("Failed to fetch locations", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [accessToken, page, search]);

  return { locations, loading, page, totalPages, setPage, search, setSearch, setLocations };
}

export async function deleteLocation(accessToken: string, id: string): Promise<unknown> {
  return apiFetchJson<unknown>(`/api/admin/locations/${encodeURIComponent(id)}/delete`, {
    method: "DELETE",
    accessToken,
  });
}

export async function getLocationById(accessToken: string, id: string): Promise<Location> {
  return apiFetchJson<Location>(`/api/admin/locations/${encodeURIComponent(id)}`, {
    method: "GET",
    accessToken,
  });
}

export async function createLocation(accessToken: string, data: Record<string, unknown>): Promise<Location> {
  return apiFetchJson<Location>("/api/admin/locations/create", {
    method: "POST",
    accessToken,
    body: JSON.stringify(data),
  });
}

export async function updateLocation(
  accessToken: string,
  id: string,
  data: Record<string, unknown>
): Promise<Location> {
  return apiFetchJson<Location>(`/api/admin/locations/${encodeURIComponent(id)}/edit`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(data),
  });
}
