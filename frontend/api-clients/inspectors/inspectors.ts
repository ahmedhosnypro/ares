import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

// ─── Types ────────────────────────────────────────────────────────────
export interface Inspector {
  inspectorId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  employeeCode: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface InspectorRecentInspection {
  inspectionId: string;
  bookingId: string;
  bookingNumber: string | null;
  status: "Pending" | "Approved" | "Rejected";
  inspectionDate: string;
  submittedAt: string | null;
}

export interface InspectorDetails {
  inspector: Inspector;
  assignedCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  recentInspections: InspectorRecentInspection[];
}

export interface CreateInspectorPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
  employeeCode: string;
  isAvailable: boolean;
}

export interface UpdateInspectorStatusPayload {
  isActive: boolean;
  isAvailable?: boolean | null;
}

// ─── API calls ────────────────────────────────────────────────────────
async function token() {
  const session = await getSession();
  return session?.accessToken ?? undefined;
}

export async function listInspectors(activeOnly?: boolean): Promise<Inspector[]> {
  const qs = activeOnly === undefined ? "" : `?activeOnly=${String(activeOnly)}`;
  return apiFetchJson<Inspector[]>(`/api/admin/inspectors${qs}`, {
    method: "GET",
    accessToken: await token(),
  });
}

export async function getInspectorDetails(inspectorId: string): Promise<InspectorDetails> {
  return apiFetchJson<InspectorDetails>(`/api/admin/inspectors/${inspectorId}`, {
    method: "GET",
    accessToken: await token(),
  });
}

export async function createInspector(payload: CreateInspectorPayload): Promise<Inspector> {
  return apiFetchJson<Inspector>(`/api/admin/inspectors`, {
    method: "POST",
    accessToken: await token(),
    body: JSON.stringify(payload),
  });
}

export async function updateInspectorStatus(
  inspectorId: string,
  payload: UpdateInspectorStatusPayload
): Promise<Inspector> {
  return apiFetchJson<Inspector>(`/api/admin/inspectors/${inspectorId}/status`, {
    method: "PATCH",
    accessToken: await token(),
    body: JSON.stringify(payload),
  });
}
