import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

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
