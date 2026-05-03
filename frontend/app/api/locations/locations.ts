import { useState, useEffect } from "react";
import axios from "axios";
import { toApiUrl } from "@/utils/api-client";

export function useLocations(accessToken?: string) {
  const [locations, setLocations] = useState<any[]>([]);
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

        const response = await axios.get(
          toApiUrl(`/api/locations/${page}/${size}/en?${queryParams.toString()}`),
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }
        );

        if (isMounted) {
          setLocations(response.data.resultData || []);
          const totalRecords = response.data.pageInfo?.[0]?.totalRecords || 0;
          setTotalPages(Math.max(1, Math.ceil(totalRecords / size)));
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [accessToken, page, search]);

  return { locations, loading, page, totalPages, setPage, search, setSearch, setLocations };
}

export async function deleteLocation(accessToken: string, id: string) {
  const response = await axios.delete(toApiUrl(`/api/admin/locations/${id}/delete`), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function getLocationById(accessToken: string, id: string) {
  const response = await axios.get(toApiUrl(`/api/admin/locations/${id}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function createLocation(accessToken: string, data: any) {
  const response = await axios.post(toApiUrl('/api/admin/locations/create'), data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

export async function updateLocation(accessToken: string, id: string, data: any) {
  const response = await axios.put(toApiUrl(`/api/admin/locations/${id}/edit`), data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
