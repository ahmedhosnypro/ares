import { apiFetchJson } from "@/utils/api-client";

/**
 * Frontend client for the supplier-vehicles backend
 * (`backend/Api/Controllers/SupplierVehiclesController.cs`).
 *
 * Reuses the project-wide `apiFetchJson` helper for consistent
 * Authorization-header injection and error normalization, so this client
 * stays consistent with `api-clients/supplier-dashboard` and the rest of the
 * frontend.
 *
 * Wire shape mirrors the .NET DTOs (camelCase via the default ASP.NET
 * serializer).
 */

// ── Types — keep in lockstep with the backend DTOs ────────────────────────────

export interface SupplierVehicleListItem {
  vehicleId: string;
  make: string;
  model: string;
  year: number | null;
  imageUrl: string;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  availabilityStatus: string;
  bookingsCount: number;
  createdAt: string;
}

export interface SupplierVehicleDetails {
  vehicleId: string;
  make: string;
  model: string;
  year: number | null;
  color: string;
  licensePlate: string;
  transmission: string;
  fuelType: string;
  seats: number | null;
  pricePerDay: number;
  locationCity: string;
  description: string;
  imageUrl: string;
  status: string;
  availabilityStatus: string;
  categoryId?: string;
  bookingsCount: number;
  /** Server-side flag — true when the vehicle is in a Rejected state. */
  isReadOnly: boolean;
  createdAt: string;
  images?: { url: string; isPrimary: boolean }[];
  features?: { featureName: string; featureDescription?: string; featureCategory?: string }[];
}

/**
 * Mirrors `Backend.Application.DTOs.Common.PagedResult<T>` on the wire.
 * Note: the backend record exposes `HasPreviousPage`/`HasNextPage` as
 * read-only properties; with the default System.Text.Json setup those are
 * not serialized, so we don't include them here.
 */
export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SupplierVehicleListQuery {
  search?: string;
  status?: string;
  availabilityStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface VehicleImageUpdatePayload {
  url: string;
  isPrimary: boolean;
}

export interface VehicleFeatureUpdatePayload {
  featureName: string;
  featureDescription?: string;
  featureCategory?: string;
}

export interface CreateSupplierVehiclePayload {
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
  description?: string;
  /** Single primary image URL — see `Image Handling` in the spec. */
  imageUrl?: string;
  images?: VehicleImageUpdatePayload[];
  features?: VehicleFeatureUpdatePayload[];
  categoryId: string;
}

/**
 * Update payload mirrors the backend's partial-update semantics — only
 * fields that are sent get applied.
 */
export interface UpdateSupplierVehiclePayload extends Partial<CreateSupplierVehiclePayload> {
  status?: string;
  availabilityStatus?: string;
}

export interface VehicleResponse {
  vehicleId: string;
  message: string;
  success: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildListUrl(query: SupplierVehicleListQuery): string {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status?.trim()) params.set("status", query.status.trim());
  if (query.availabilityStatus?.trim()) params.set("availabilityStatus", query.availabilityStatus.trim());
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return qs ? `/api/supplier/vehicles?${qs}` : "/api/supplier/vehicles";
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export async function getSupplierVehicles(
  accessToken: string,
  query: SupplierVehicleListQuery = {}
): Promise<PagedResult<SupplierVehicleListItem>> {
  return apiFetchJson<PagedResult<SupplierVehicleListItem>>(buildListUrl(query), {
    method: "GET",
    accessToken,
  });
}

export async function getSupplierVehicleById(accessToken: string, vehicleId: string): Promise<SupplierVehicleDetails> {
  return apiFetchJson<SupplierVehicleDetails>(`/api/supplier/vehicles/${vehicleId}`, {
    method: "GET",
    accessToken,
  });
}

export async function createSupplierVehicle(
  accessToken: string,
  payload: CreateSupplierVehiclePayload
): Promise<VehicleResponse> {
  return apiFetchJson<VehicleResponse>("/api/supplier/vehicles", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function updateSupplierVehicle(
  accessToken: string,
  vehicleId: string,
  payload: UpdateSupplierVehiclePayload
): Promise<VehicleResponse> {
  return apiFetchJson<VehicleResponse>(`/api/supplier/vehicles/${vehicleId}`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

/**
 * General vehicle update for admins.
 */
export async function updateVehicle(
  accessToken: string,
  vehicleId: string,
  payload: UpdateSupplierVehiclePayload
): Promise<VehicleResponse> {
  return apiFetchJson<VehicleResponse>(`/api/admin/cars/${vehicleId}/edit`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function deleteSupplierVehicle(accessToken: string, vehicleId: string): Promise<VehicleResponse> {
  return apiFetchJson<VehicleResponse>(`/api/supplier/vehicles/${vehicleId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function setSupplierVehicleAvailability(
  accessToken: string,
  vehicleId: string,
  available: boolean
): Promise<VehicleResponse> {
  return apiFetchJson<VehicleResponse>(`/api/supplier/vehicles/${vehicleId}/availability`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ available }),
  });
}

export async function uploadVehicleImage(
  accessToken: string,
  vehicleId: string,
  file: File,
  isAdminFlow: boolean = false
): Promise<{ imageId: string; url: string; size: string; isPrimary: boolean }> {
  const formData = new FormData();
  formData.append("file", file);

  const endpoint = isAdminFlow
    ? `/api/admin/cars/${vehicleId}/images/upload`
    : `/api/supplier/vehicles/${vehicleId}/images/upload`;

  return apiFetchJson<{ imageId: string; url: string; size: string; isPrimary: boolean }>(endpoint, {
    method: "POST",
    accessToken,
    body: formData,
  });
}

// ── Status helpers (used by the UI) ───────────────────────────────────────────

export function isRejectedStatus(status: string | null | undefined): boolean {
  return !!status && status.toLowerCase() === "rejected";
}

export function isApprovedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "approved" || s === "active";
}

export function isPendingStatus(status: string | null | undefined): boolean {
  return !!status && status.toLowerCase() === "pending";
}
