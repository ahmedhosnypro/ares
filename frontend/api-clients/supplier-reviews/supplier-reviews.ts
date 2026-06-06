import { apiFetchJson } from "@/utils/api-client";

/**
 * Frontend client for the supplier-reviews backend
 * (`backend/Api/Controllers/SupplierReviewsController.cs`).
 *
 * Reuses the project-wide `apiFetchJson` helper for consistent
 * Authorization-header injection and error normalization, in line with
 * the other supplier api-clients (`supplier-vehicles`, `supplier-dashboard`).
 *
 * Wire shape mirrors the .NET DTOs (camelCase via the default ASP.NET
 * serializer):
 *   - `SupplierReviewListItemDto`
 *   - `SupplierReviewStatisticsDto`
 *   - `SupplierReplyRequest`
 *   - `SupplierReportReviewRequest`
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupplierReviewListItem {
  reviewId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number | null;
  vehicleImageUrl: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  supplierReply: string | null;
  repliedAt: string | null;
  hasReply: boolean;
  isReported: boolean;
  reportReason: string | null;
  reportedAt: string | null;
}

export interface SupplierReviewStatistics {
  averageRating: number;
  totalReviews: number;
  fiveStarReviews: number;
  pendingReplies: number;
}

/**
 * Mirrors `Backend.Application.DTOs.Common.PagedResult<T>` on the wire.
 * Reused with the same shape as `supplier-vehicles` to keep table/pagination
 * components consistent across the supplier portal.
 */
export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type SupplierReviewReplyStatus = "" | "replied" | "unreplied"; // using lowercase literals for backend compatibility

export type SupplierReviewSortBy = "newest" | "oldest" | "highest" | "lowest";

export interface SupplierReviewListQuery {
  vehicleId?: string;
  rating?: number;
  replyStatus?: SupplierReviewReplyStatus;
  fromDate?: string; // ISO date (yyyy-MM-dd) or full ISO
  toDate?: string;
  sortBy?: SupplierReviewSortBy;
  page?: number;
  pageSize?: number;
}

export interface SupplierReplyPayload {
  reply: string;
}

export interface SupplierReportPayload {
  reason: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildListUrl(query: SupplierReviewListQuery): string {
  const params = new URLSearchParams();
  if (query.vehicleId?.trim()) params.set("vehicleId", query.vehicleId.trim());
  if (typeof query.rating === "number" && query.rating >= 1 && query.rating <= 5) {
    params.set("rating", String(query.rating));
  }
  if (query.replyStatus) params.set("replyStatus", query.replyStatus);
  if (query.fromDate?.trim()) params.set("fromDate", query.fromDate.trim());
  if (query.toDate?.trim()) params.set("toDate", query.toDate.trim());
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return qs ? `/api/supplier/reviews?${qs}` : "/api/supplier/reviews";
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export async function getSupplierReviews(
  accessToken: string,
  query: SupplierReviewListQuery = {}
): Promise<PagedResult<SupplierReviewListItem>> {
  return apiFetchJson<PagedResult<SupplierReviewListItem>>(buildListUrl(query), {
    method: "GET",
    accessToken,
  });
}

export async function getSupplierReviewStatistics(accessToken: string): Promise<SupplierReviewStatistics> {
  return apiFetchJson<SupplierReviewStatistics>("/api/supplier/reviews/statistics", {
    method: "GET",
    accessToken,
  });
}

/**
 * Create or update the supplier reply on a single review.
 * Backend semantics: PUT — one reply per review, idempotent overwrite.
 */
export async function saveSupplierReply(
  accessToken: string,
  reviewId: string,
  payload: SupplierReplyPayload
): Promise<SupplierReviewListItem> {
  return apiFetchJson<SupplierReviewListItem>(`/api/supplier/reviews/${reviewId}/reply`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function reportSupplierReview(
  accessToken: string,
  reviewId: string,
  payload: SupplierReportPayload
): Promise<SupplierReviewListItem> {
  return apiFetchJson<SupplierReviewListItem>(`/api/supplier/reviews/${reviewId}/report`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}
