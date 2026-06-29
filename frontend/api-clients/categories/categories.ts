import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

export interface Category {
  id: string;
  name: string;
  description?: string;
  commissionPercentage: number;
  isActive: boolean;
  vehicleCount?: number;
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
  const searchPath = "/api/admin/categories/search";
  const endpoint = queryString ? `${searchPath}?${queryString}` : searchPath;

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
}): Promise<Category> {
  const session = await getSession();

  return apiFetchJson<Category>(`/api/admin/categories`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

/**
 * Creates a category with an image file upload.
 * The backend endpoint must accept multipart/form-data with an `image` file field.
 * All other fields are appended as plain string form fields.
 */
export async function createCategoryWithImage(
  payload: {
    name: string;
    description?: string;
    commissionPercentage: number;
    isActive: boolean;
  },
  imageFile: File
): Promise<Category> {
  const session = await getSession();

  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description) formData.append("description", payload.description);
  formData.append("commissionPercentage", String(payload.commissionPercentage));
  formData.append("isActive", String(payload.isActive));
  formData.append("image", imageFile);

  return apiFetchJson<Category>(`/api/admin/categories`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: formData,
  });
}

export async function updateCategory(
  id: string,
  payload: {
    name: string;
    description?: string;
    commissionPercentage: number;
    isActive: boolean;
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
