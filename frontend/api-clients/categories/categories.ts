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
