import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface DiscountCodeResponse {
  discountId: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validTo: string;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number;
  currentUsageCount: number;
  remainingUses: number | null;
  customerSegments: string[];
  vehicleCategoryIds: string[];
  minimumDuration: number | null;
  minimumValue: number | null;
  allowStacking: boolean;
  isAutomatic: boolean;
  priority: number;
  isActive: boolean;
  supplierId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCodeCreateRequest {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validTo: string;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number;
  customerSegments?: string[];
  vehicleCategoryIds?: string[];
  minimumDuration?: number | null;
  minimumValue?: number | null;
  allowStacking?: boolean;
  isAutomatic?: boolean;
  priority?: number;
  supplierId?: string;
}

export interface DiscountCodeUpdateRequest {
  code?: string;
  description?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  validFrom?: string;
  validTo?: string;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number;
  customerSegments?: string[];
  vehicleCategoryIds?: string[];
  minimumDuration?: number | null;
  minimumValue?: number | null;
  allowStacking?: boolean;
  isAutomatic?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface DiscountAnalyticsResponse {
  discountId: string;
  code: string;
  totalUses: number;
  uniqueCustomers: number;
  totalRevenue: number;
  totalDiscount: number;
  conversionRate: number;
  roi: number;
  newCustomers: number;
  usageTimeline: Array<{
    date: string;
    uses: number;
    discountAmount: number;
  }>;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function getDiscountCodes(
  params: { status?: string; supplierId?: string; page?: number; pageSize?: number },
  token: string
): Promise<PagedResult<DiscountCodeResponse>> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.supplierId) queryParams.append("supplierId", params.supplierId);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const queryString = queryParams.toString();
  const basePath = "/api/v1/promotions/discounts";
  const endpoint = queryString ? `${basePath}?${queryString}` : basePath;

  return apiFetchJson<PagedResult<DiscountCodeResponse>>(endpoint, {
    method: "GET",
    accessToken: token,
  });
}

export async function createDiscountCode(
  request: DiscountCodeCreateRequest,
  token: string
): Promise<DiscountCodeResponse> {
  return apiFetchJson<DiscountCodeResponse>("/api/v1/promotions/discounts", {
    method: "POST",
    accessToken: token,
    body: JSON.stringify(request),
  });
}

export async function updateDiscountCode(
  id: string,
  request: DiscountCodeUpdateRequest,
  token: string
): Promise<DiscountCodeResponse> {
  return apiFetchJson<DiscountCodeResponse>(`/api/v1/promotions/discounts/${id}`, {
    method: "PUT",
    accessToken: token,
    body: JSON.stringify(request),
  });
}

export async function deleteDiscountCode(id: string, permanent: boolean, token: string): Promise<void> {
  const queryParams = new URLSearchParams();
  if (permanent) queryParams.append("permanent", "true");

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/api/v1/promotions/discounts/${id}?${queryString}`
    : `/api/v1/promotions/discounts/${id}`;

  return apiFetchJson(endpoint, {
    method: "DELETE",
    accessToken: token,
  });
}

export async function getDiscountAnalytics(
  id: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<DiscountAnalyticsResponse> {
  const session = await getSession();

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const queryString = queryParams.toString();
  const basePath = `/api/v1/promotions/analytics/${id}`;
  const endpoint = queryString ? `${basePath}?${queryString}` : basePath;

  return apiFetchJson<DiscountAnalyticsResponse>(endpoint, {
    method: "GET",
    accessToken: token ?? session?.accessToken ?? undefined,
  });
}
