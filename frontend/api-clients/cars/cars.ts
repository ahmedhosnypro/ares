import { useState, useEffect, useCallback } from "react";
import { apiFetchJson, toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface Vehicle {
  id: string;
  vehicleId?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  transmission: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  dailyRate?: number;
  locationCity: string;
  description: string;
  status: string;
  availabilityStatus: string;
  available?: boolean;
  imageUrl?: string;
  category?: string;
  hasActiveBookings?: boolean;
  [key: string]: unknown;
}

interface VehicleResponse {
  data?: Vehicle[];
  totalPages?: number;
}

export function useVehicles(accessToken: string | undefined, initialPage = 1) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchVehicles = useCallback(
    async (currentPage: number) => {
      if (!accessToken) return;
      try {
        setLoading(true);
        const response = await apiFetchJson<VehicleResponse>(
          `api/vehicles/search/${String(currentPage)}/${String(pageSize)}`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify({}),
          }
        );
        setVehicles(response.data || []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        logger.error("Failed to fetch vehicles", error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    void fetchVehicles(page);
  }, [page, fetchVehicles]);

  return { vehicles, loading, page, totalPages, setPage, refresh: () => void fetchVehicles(page) };
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
  status: string;
  availabilityStatus: string;
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

// 1. Function to Delete a Car

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

// Update car

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

// get car by id

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
