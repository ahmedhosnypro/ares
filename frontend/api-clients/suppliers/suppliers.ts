import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export interface Supplier {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  status: string;
  phoneNumber?: string;
  companyProfile?: {
    companyName?: string;
    commercialRegistrationNumber?: string;
    taxId?: string;
  };
  [key: string]: unknown;
}

export interface PageInfo {
  totalRecords: number;
}

export interface SupplierResponse {
  data?: Supplier[];
  resultData?: Supplier[];
  items?: Supplier[];
  pageInfo?: PageInfo[];
}

/**
 * GET paginated suppliers
 */
export async function getSuppliers(page = 1, size = 10): Promise<SupplierResponse> {
  const session = await getSession();

  return apiFetchJson<SupplierResponse>(`/api/suppliers/${String(page)}/${String(size)}`, {
    method: "POST",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify({
      keyword: null,
      types: ["user"],
    }),
  });
}

// create new supplier
export const createSupplier = async (payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  companyName: string;
  commercialRegistrationNumber: string;
  taxId: string;
}) => {
  const session = await getSession();

  if (!session?.accessToken) {
    throw new Error("No access token found");
  }

  return apiFetchJson<string>(`/api/admin/suppliers/create`, {
    method: "POST",
    accessToken: session.accessToken,
    body: JSON.stringify(payload),
  });
};

/**
 * GET Supplier by id
 */
export async function getSupplierById(id: string): Promise<Supplier> {
  const session = await getSession();

  const data = await apiFetchJson<Supplier>(`/api/suppliers/${id}`, {
    method: "GET",
    accessToken: session?.accessToken ?? undefined,
  });

  logger.debug("Supplier details response", data);

  return data;
}

// Update Supplier

export async function updateSupplier(
  id: string,
  payload: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    status: string;
    companyName: string;
    commercialRegistrationNumber: string;
    taxId: string;
  }
): Promise<Supplier> {
  const session = await getSession();

  return apiFetchJson(`/api/admin/suppliers/${id}/edit`, {
    method: "PUT",
    accessToken: session?.accessToken ?? undefined,
    body: JSON.stringify(payload),
  });
}

export async function deleteSupplier(id: string): Promise<Supplier> {
  const session = await getSession();

  try {
    return await apiFetchJson(`/api/admin/suppliers/${id}/delete`, {
      method: "DELETE",
      accessToken: session?.accessToken,
    });
  } catch (err) {
    logger.error("Delete supplier failed", err);
    throw err;
  }
}
