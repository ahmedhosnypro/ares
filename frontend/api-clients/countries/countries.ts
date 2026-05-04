import { useState, useEffect, useCallback } from "react";
import { apiFetchJson, toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface Country {
  _id: string;
  name: string;
  image?: string | null;
  [key: string]: unknown;
}

export interface PageInfo {
  totalRecords: number;
}

export interface PaginatedResponse<T> {
  resultData: T[];
  pageInfo: PageInfo[];
}

const PAGE_SIZE = 10;
const LANGUAGE = "en"; // Default language

export function useCountries(accessToken: string | undefined, initialPage = 1, initialSearch = "") {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchCountries = useCallback(
    async (currentPage: number, currentSearch: string) => {
      try {
        setLoading(true);
        let url = `api/countries/${String(currentPage)}/${String(PAGE_SIZE)}/${LANGUAGE}`;
        if (currentSearch) {
          url += `?s=${encodeURIComponent(currentSearch)}`;
        }

        const response = await apiFetchJson<PaginatedResponse<Country>>(url, {
          method: "GET",
          accessToken, // Although public, it's fine to pass
        });

        setCountries(response.resultData);
        const total = response.pageInfo[0].totalRecords;
        setTotalRecords(total);
        setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
      } catch (error) {
        logger.error("Failed to fetch countries", error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    void fetchCountries(page, search);
  }, [page, search, fetchCountries]);

  return {
    countries,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    search,
    setSearch,
    refresh: () => {
      void fetchCountries(page, search);
    },
  };
}

export const checkCountry = async (
  accessToken: string,
  id: string
): Promise<{ canDelete: boolean; message?: string }> => {
  const res = await fetch(toApiUrl(`/api/check-country/${encodeURIComponent(id)}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 204) {
    return { canDelete: true };
  }

  const data = (await res.json()) as { message: string };
  if (res.status === 200) {
    return { canDelete: false, message: data.message };
  }

  throw new Error("Failed to check country status");
};

export const deleteCountry = async (accessToken: string, id: string): Promise<unknown> => {
  const res = await fetch(toApiUrl(`/api/delete-country/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorData?.message || "Failed to delete country");
  }

  return await res.json();
};
