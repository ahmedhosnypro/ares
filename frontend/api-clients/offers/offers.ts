import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface PublicOffer {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountDisplay: string;
  validFrom: string;
  validTo: string;
  categoryNames: string[] | null;
  isAutomatic: boolean;
  minimumDurationHours: number | null;
  minimumValue: number | null;
}

export interface DiscountValidationRequest {
  code: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  subtotal: number;
}

export interface DiscountValidationResponse {
  isValid: boolean;
  discountId?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  savingsPercentage: number;
  errors: Array<{ code: string; message: string }>;
}

export interface DiscountApplyRequest {
  bookingId: string;
  code: string;
}

export interface BookingDiscountResult {
  success: boolean;
  bookingId: string;
  discountApplied?: number;
  originalPrice?: number;
  finalPrice?: number;
  errorMessage?: string;
}

export interface AutomaticDiscountDto {
  discountId: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number | null;
  priority: number;
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

export async function getPublicOffers(page: number = 1, size: number = 20): Promise<PagedResult<PublicOffer>> {
  return apiFetchJson<PagedResult<PublicOffer>>(`/api/public/offers/${page}/${size}`, {
    method: "GET",
  });
}

export async function validateDiscountCode(
  request: DiscountValidationRequest,
  token?: string
): Promise<DiscountValidationResponse> {
  const session = await getSession();

  return apiFetchJson<DiscountValidationResponse>("/api/public/promotions/validate", {
    method: "POST",
    accessToken: token ?? session?.accessToken ?? undefined,
    body: JSON.stringify(request),
  });
}

export async function applyDiscountToBooking(
  request: DiscountApplyRequest,
  token: string
): Promise<BookingDiscountResult> {
  return apiFetchJson<BookingDiscountResult>("/api/v1/promotions/apply", {
    method: "POST",
    accessToken: token,
    body: JSON.stringify(request),
  });
}

export async function getAutomaticDiscounts(vehicleId?: string, token?: string): Promise<AutomaticDiscountDto[]> {
  const session = await getSession();

  const queryParams = new URLSearchParams();
  if (vehicleId) queryParams.append("vehicleId", vehicleId);

  return apiFetchJson<AutomaticDiscountDto[]>(`/api/v1/promotions/automatic?${queryParams.toString()}`, {
    method: "GET",
    accessToken: token ?? session?.accessToken ?? undefined,
  });
}
