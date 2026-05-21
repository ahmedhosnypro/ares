import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

/**
 * Admin-facing DTO returned by the admin driver license endpoints.
 * Mirrors the shape produced by `Backend.Application.DTOs.DriverLicense.AdminDriverLicenseDto`.
 *
 * Field names match the JSON casing produced by ASP.NET Core's default
 * serializer (camelCase). Image URLs are server-relative (e.g. `/uploads/...`)
 * and must be prefixed with `NEXT_PUBLIC_API_BASE_URL` before rendering.
 */
export interface AdminDriverLicenseDto {
  readonly id: string;
  readonly userId: string;
  readonly userFirstName: string;
  readonly userLastName: string;
  readonly userEmail: string;
  readonly licenseNumber: string;
  /** ISO date string. */
  readonly licenseExpiryDate: string;
  readonly licenseImageUrl: string | null;
  /** "Pending" | "Verified" | "Rejected" */
  readonly status: string;
  readonly submittedAt: string;
  readonly updatedAt: string | null;
  readonly rejectionReason: string | null;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

/**
 * GET /api/admin/driver-licenses
 *
 * Optional `status` filter accepts "Pending" | "Verified" | "Rejected"
 * (case-insensitive). The literal string "all" is treated as no filter
 * to keep the call-site identical to the identity verifications client.
 */
export async function getAdminDriverLicenses(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PagedResult<AdminDriverLicenseDto>> {
  const session = await getSession();

  let url = `/api/admin/driver-licenses?page=${String(page)}&pageSize=${String(pageSize)}`;
  if (status && status !== "all") {
    url += `&status=${status}`;
  }

  return apiFetchJson<PagedResult<AdminDriverLicenseDto>>(url, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

/**
 * PATCH /api/admin/driver-licenses/{id}/approve
 */
export async function approveDriverLicense(id: string): Promise<AdminDriverLicenseDto> {
  const session = await getSession();

  return apiFetchJson<AdminDriverLicenseDto>(`/api/admin/driver-licenses/${id}/approve`, {
    method: "PATCH",
    accessToken: session?.accessToken ?? undefined,
  });
}

/**
 * PATCH /api/admin/driver-licenses/{id}/reject
 *
 * `rejectionReason` is required; backend enforces 3–500 characters.
 */
export async function rejectDriverLicense(id: string, rejectionReason: string): Promise<AdminDriverLicenseDto> {
  const session = await getSession();

  return apiFetchJson<AdminDriverLicenseDto>(`/api/admin/driver-licenses/${id}/reject`, {
    method: "PATCH",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify({ rejectionReason }),
  });
}
