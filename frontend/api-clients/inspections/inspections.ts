import { getSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

// ─── Types ────────────────────────────────────────────────────────────
export type InspectionStatus = "Pending" | "Approved" | "Rejected";

export interface InspectionImage {
  id: string;
  inspectionId: string;
  imageUrl: string;
  createdAt: string;
}

export interface InspectionSummary {
  inspectionId: string;
  bookingId: string;
  bookingNumber: string | null;
  vehicleId: string;
  vehicleDisplayName: string;
  inspectorId: string;
  inspectorFullName: string;
  status: InspectionStatus;
  isSubmitted: boolean;
  inspectionDate: string;
  submittedAt: string | null;
  imageCount: number;
}

export interface InspectionDetails {
  inspectionId: string;
  bookingId: string;
  bookingNumber: string | null;
  vehicleId: string;
  vehicleDisplayName: string;
  inspectorId: string;
  inspectorFullName: string;
  status: InspectionStatus;
  isSubmitted: boolean;
  notes: string | null;
  generalCondition: string | null;
  odometerReading: number;
  fuelLevel: number;
  inspectionDate: string;
  submittedAt: string | null;
  createdAt: string;
  images: InspectionImage[];
}

export interface AssignInspectorPayload {
  inspectorUserId: string;
}

export interface UpdateInspectionDraftPayload {
  notes?: string | null;
  generalCondition?: string | null;
  odometerReading?: number;
  fuelLevel?: number;
}

export interface SubmitInspectionPayload {
  approve: boolean;
  notes: string;
  generalCondition?: string | null;
  odometerReading?: number;
  fuelLevel?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────
async function token() {
  const session = await getSession();
  return session?.accessToken ?? undefined;
}

// ─── Admin: assign inspector to booking ────────────────────────────────
export async function assignInspectorToBooking(
  bookingId: string,
  payload: AssignInspectorPayload
): Promise<InspectionDetails> {
  return apiFetchJson<InspectionDetails>(`/api/admin/bookings/${bookingId}/inspection/assign`, {
    method: "POST",
    accessToken: await token(),
    body: JSON.stringify(payload),
  });
}

// ─── Inspector dashboard ──────────────────────────────────────────────
export async function listMyInspections(includeSubmitted = false): Promise<InspectionSummary[]> {
  return apiFetchJson<InspectionSummary[]>(`/api/inspector/inspections?includeSubmitted=${String(includeSubmitted)}`, {
    method: "GET",
    accessToken: await token(),
  });
}

export async function getInspectionDetails(inspectionId: string): Promise<InspectionDetails> {
  return apiFetchJson<InspectionDetails>(`/api/inspector/inspections/${inspectionId}`, {
    method: "GET",
    accessToken: await token(),
  });
}

export async function updateInspectionDraft(
  inspectionId: string,
  payload: UpdateInspectionDraftPayload
): Promise<InspectionDetails> {
  return apiFetchJson<InspectionDetails>(`/api/inspector/inspections/${inspectionId}`, {
    method: "PATCH",
    accessToken: await token(),
    body: JSON.stringify(payload),
  });
}

export async function addInspectionImage(inspectionId: string, imageUrl: string): Promise<InspectionImage> {
  return apiFetchJson<InspectionImage>(`/api/inspector/inspections/${inspectionId}/images`, {
    method: "POST",
    accessToken: await token(),
    body: JSON.stringify({ imageUrl }),
  });
}

/**
 * Multipart upload — sends raw image files which the backend persists
 * under wwwroot/uploads/inspections/{id} and registers as images.
 */
export async function uploadInspectionImages(inspectionId: string, files: File[]): Promise<InspectionImage[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });
  return apiFetchJson<InspectionImage[]>(`/api/inspector/inspections/${inspectionId}/images/upload`, {
    method: "POST",
    accessToken: await token(),
    body: formData,
  });
}

export async function submitInspection(
  inspectionId: string,
  payload: SubmitInspectionPayload
): Promise<InspectionDetails> {
  return apiFetchJson<InspectionDetails>(`/api/inspector/inspections/${inspectionId}/submit`, {
    method: "POST",
    accessToken: await token(),
    body: JSON.stringify(payload),
  });
}

export async function getInspectionHistory(): Promise<InspectionSummary[]> {
  return apiFetchJson<InspectionSummary[]>(`/api/inspector/inspections/history`, {
    method: "GET",
    accessToken: await token(),
  });
}

// ─── Inspector today KPI stats ────────────────────────────────────────
export interface InspectorTodayStats {
  checkOutsCount: number;
  checkInsCount: number;
  overdueCount: number;
  completedTodayCount: number;
}

export async function getInspectorTodayStats(): Promise<InspectorTodayStats> {
  return apiFetchJson<InspectorTodayStats>(`/api/inspector/today-stats`, {
    method: "GET",
    accessToken: await token(),
  });
}
