import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface AdminVerificationDto {
  readonly id: string;
  readonly userId: string;
  readonly userFirstName: string;
  readonly userLastName: string;
  readonly userEmail: string;
  readonly documentType: string;
  readonly status: string;
  readonly submittedAt: string;
  readonly documentFrontUrl: string | null;
  readonly documentBackUrl: string | null;
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
 * GET /api/admin/verifications
 */
export async function getAdminVerifications(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PagedResult<AdminVerificationDto>> {
  const session = await getSession();

  let url = `/api/admin/verifications?page=${page}&pageSize=${pageSize}`;
  if (status && status !== "all") {
    url += `&status=${status}`;
  }

  return apiFetchJson<PagedResult<AdminVerificationDto>>(url, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

/**
 * PATCH /api/admin/verifications/{id}/approve
 */
export async function approveVerification(id: string): Promise<AdminVerificationDto> {
  const session = await getSession();

  return apiFetchJson<AdminVerificationDto>(`/api/admin/verifications/${id}/approve`, {
    method: "PATCH",
    accessToken: session?.accessToken ?? undefined,
  });
}

/**
 * PATCH /api/admin/verifications/{id}/reject
 */
export async function rejectVerification(id: string, rejectionReason: string): Promise<AdminVerificationDto> {
  const session = await getSession();

  return apiFetchJson<AdminVerificationDto>(`/api/admin/verifications/${id}/reject`, {
    method: "PATCH",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify({ rejectionReason }),
  });
}
