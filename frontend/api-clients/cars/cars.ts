import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetchJson, toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// ── Vehicle row type returned by the admin/supplier vehicles list ────────────

export interface Vehicle {
  id: string;
  vehicleId?: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  pricePerDay?: number;
  dailyRate?: number;
  locationCity?: string;
  description?: string;
  status?: string;
  availabilityStatus?: string;
  available?: boolean;
  imageUrl?: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  hasActiveBookings?: boolean;
  // ── Admin table extras (backed by VehicleListDto) ──────────────────────────
  /** Backend `IsOnRental` — true when at least one Active booking is open. */
  isOnRental?: boolean;
  /** Supplier first + last name, concatenated. */
  supplierName?: string;
  [key: string]: unknown;
}

interface VehicleResponse {
  data?: Vehicle[];
  totalPages?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

// ── Filter shape forwarded to the backend admin search endpoint ──────────────

export enum VehicleStatus {
  Available = "Available",
  Unavailable = "Unavailable",
  FullyBooked = "FullyBooked",
  ComingSoon = "ComingSoon",
  Maintenance = "Maintenance",
  Retired = "Retired",
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export type VehicleStatusFilter = "" | VehicleStatus;
export type VehicleSortBy = "newest" | "oldest" | "priceHigh" | "priceLow";

export interface AdminVehicleFilter {
  keyword?: string;
  status?: VehicleStatusFilter;
  supplierId?: string;
  transmission?: string;
  sortBy?: VehicleSortBy;
  categoryId?: string;
}

function mapStatusToBackend(status: VehicleStatusFilter | undefined): string | undefined {
  if (!status) return undefined;
  switch (status) {
    case VehicleStatus.FullyBooked:
      return "OnRental";
    case VehicleStatus.Retired:
      return "Inactive";
    case VehicleStatus.Maintenance:
      return "Maintenance";
    case VehicleStatus.Available:
      return "Available";
    case VehicleStatus.Unavailable:
      return "Unavailable";
    case VehicleStatus.ComingSoon:
      return "ComingSoon";
    case VehicleStatus.Pending:
      return "Pending";
    case VehicleStatus.Approved:
      return "Approved";
    case VehicleStatus.Rejected:
      return "Rejected";
    default:
      return undefined;
  }
}

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

export function useVehicles(accessToken: string | undefined, filter: AdminVehicleFilter = {}, initialPage = 1) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;

  const [debouncedKeyword, setDebouncedKeyword] = useState(filter.keyword ?? "");
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedKeyword(filter.keyword ?? "");
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [filter.keyword]);

  const nonKeywordFilter = useMemo(
    () => ({
      status: filter.status ?? "",
      supplierId: filter.supplierId ?? "",
      transmission: filter.transmission ?? "",
      sortBy: filter.sortBy ?? "newest",
      categoryId: filter.categoryId ?? "",
    }),
    [filter.status, filter.supplierId, filter.transmission, filter.sortBy, filter.categoryId]
  );

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedKeyword, nonKeywordFilter]);

  const backendBody = useMemo(
    () => ({
      suppliers: filter.supplierId ? [filter.supplierId] : null,
      keyword: debouncedKeyword.trim() ? debouncedKeyword.trim() : null,
      status: mapStatusToBackend(filter.status) ?? null,
      transmission: filter.transmission ? filter.transmission.trim() : null,
      sortBy: filter.sortBy ?? null,
      categoryId: filter.categoryId ? filter.categoryId : null,
    }),
    [debouncedKeyword, filter.status, filter.supplierId, filter.transmission, filter.sortBy, filter.categoryId]
  );

  const fetchVehicles = useCallback(
    async (currentPage: number) => {
      if (!accessToken) return;
      try {
        setLoading(true);
        setError(null);
        const response = await apiFetchJson<VehicleResponse>(
          `api/vehicles/search/${String(currentPage)}/${String(pageSize)}`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify(backendBody),
          }
        );
        setVehicles(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.totalCount || 0);
      } catch (err) {
        logger.error("Failed to fetch vehicles", err);
        setError("Could not load vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, backendBody, pageSize]
  );

  useEffect(() => {
    void fetchVehicles(page);
  }, [page, fetchVehicles]);

  useEffect(() => {
    if (!loading && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [loading, totalPages, page]);

  return {
    vehicles,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    pageSize,
    setPage,
    refresh: () => void fetchVehicles(page),
  };
}

export interface CarPayload {
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  transmission: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  locationCity: string;
  description: string;
  categoryId: string;
  status?: string;
  availabilityStatus?: string;
  imageUrl?: string;
}

export const createCar = async (accessToken: string, payload: CarPayload) => {
  const res = await fetch(toApiUrl("/api/admin/cars/create"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      accept: "text/plain",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to create car");
  }
  return res.text();
};

export const deleteCar = async (accessToken: string, carId: string) => {
  const res = await fetch(toApiUrl(`/api/delete-car/${carId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const data = await res.text();
  logger.debug("Delete response", { status: res.status, data });
  if (!res.ok) {
    throw new Error(data || "Failed to delete car");
  }
  return data;
};

export const updateCar = async (accessToken: string, carId: string, payload: CarPayload) => {
  const res = await fetch(toApiUrl(`/api/admin/cars/${carId}/edit`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      accept: "text/plain",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to update car");
  }
  return res.text();
};

export interface CarImageUploadResponse {
  imageId: string;
  url: string;
  size: string;
  isPrimary: boolean;
}

export const uploadCarImage = async (
  accessToken: string,
  carId: string,
  file: File
): Promise<CarImageUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetchJson<CarImageUploadResponse>(`/api/admin/cars/${carId}/images/upload`, {
    method: "POST",
    accessToken,
    body: formData,
  });
};

export const getCarById = async (accessToken: string, id: string): Promise<Vehicle> => {
  const res = await fetch(toApiUrl(`/api/vehicles/${id}`), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    logger.error("API ERROR", errorText);
    logger.error("API STATUS", res.status);
    throw new Error(`Failed to fetch car (status: ${String(res.status)})`);
  }
  return res.json() as Promise<Vehicle>;
};

// ── Admin vehicle stats ───────────────────────────────────────────────────────

export interface AdminVehicleStats {
  readonly totalVehicles: number;
  readonly availableVehicles: number;
  readonly onRentalVehicles: number;
  readonly maintenanceVehicles?: number;
}

export function useAdminVehicleStats(accessToken: string | undefined) {
  const [stats, setStats] = useState<AdminVehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetchJson<AdminVehicleStats>("api/vehicles/admin/stats", {
        method: "GET",
        accessToken,
      });
      setStats(data);
    } catch (err) {
      logger.error("Failed to fetch admin vehicle stats", err);
      setError("Could not load statistics.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: () => void fetchStats() };
}
