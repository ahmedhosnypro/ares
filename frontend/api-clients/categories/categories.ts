import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface ActiveOffer {
  offerName: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  commissionPercentage: number;
  isActive: boolean;
  vehicleCount?: number;
  activeOffer?: ActiveOffer | null;
}

export interface CategoryDetails extends Category {
  bookingCount: number;
  revenue: number;
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  }>;
}

export interface Promotion {
  id: string;
  categoryId: string;
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
}

export interface CategorySummary {
  totalCategories: number;
  totalVehicles: number;
  categoriesWithOffers: number;
  averageCommission: number;
}

export interface AdminCategoryListDto {
  id: string;
  name: string;
  description?: string;
  commissionPercentage: number;
  isActive: boolean;
  vehicleCount: number;
  offerStatus: "Active" | "Expired" | "None";
  offerName?: string;
  offerPercentage?: number;
  offerEndDate?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
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

export async function getCategories(): Promise<Category[]> {
  const session = await getSession();

  return apiFetchJson<Category[]>(`/api/admin/categories`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function getCategoryDetails(id: string): Promise<CategoryDetails> {
  const session = await getSession();

  return apiFetchJson<CategoryDetails>(`/api/admin/categories/${id}/details`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function getCategorySummary(): Promise<CategorySummary> {
  const session = await getSession();

  return apiFetchJson<CategorySummary>(`/api/admin/categories/summary`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function searchCategories(params: {
  search?: string;
  status?: string;
  offer?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdminCategoryListDto>> {
  const session = await getSession();

  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.offer) queryParams.append("offer", params.offer);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/categories/search${queryString ? `?${queryString}` : ""}`;

  return apiFetchJson<PagedResult<AdminCategoryListDto>>(endpoint, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function createCategory(payload: {
  name: string;
  description?: string;
  commissionPercentage: number;
  isActive: boolean;
  offerName?: string | null;
  offerDiscountPercentage?: number | null;
  offerStartDate?: string | null;
  offerEndDate?: string | null;
  offerIsActive?: boolean | null;
}): Promise<Category> {
  const session = await getSession();

  return apiFetchJson<Category>(`/api/admin/categories`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  id: string,
  payload: {
    name: string;
    description?: string;
    commissionPercentage: number;
    isActive: boolean;
    offerName?: string | null;
    offerDiscountPercentage?: number | null;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    offerIsActive?: boolean | null;
  }
): Promise<Category> {
  const session = await getSession();

  return apiFetchJson<Category>(`/api/admin/categories/${id}`, {
    method: "PUT",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const session = await getSession();

  return apiFetchJson(`/api/admin/categories/${id}`, {
    method: "DELETE",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function bulkAssignVehicles(categoryId: string, vehicleIds: string[]): Promise<unknown> {
  const session = await getSession();

  return apiFetchJson(`/api/admin/categories/bulk-assign`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify({ categoryId, vehicleIds }),
  });
}

// Promotions

export async function getPromotionsByCategory(categoryId: string): Promise<Promotion[]> {
  const session = await getSession();

  return apiFetchJson<Promotion[]>(`/api/admin/promotions/category/${categoryId}`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });
}

export async function createPromotion(payload: {
  categoryId: string;
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status: string;
}): Promise<Promotion> {
  const session = await getSession();

  return apiFetchJson<Promotion>(`/api/admin/promotions`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function updatePromotion(
  id: string,
  payload: {
    categoryId: string;
    name: string;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    status: string;
  }
): Promise<Promotion> {
  const session = await getSession();

  return apiFetchJson<Promotion>(`/api/admin/promotions/${id}`, {
    method: "PUT",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function deletePromotion(id: string): Promise<void> {
  const session = await getSession();

  return apiFetchJson(`/api/admin/promotions/${id}`, {
    method: "DELETE",
    accessToken: session?.accessToken ?? undefined,
  });
}
