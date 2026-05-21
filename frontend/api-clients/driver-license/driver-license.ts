import { apiFetchJson, ApiError } from "@/utils/api-client";

/**
 * Possible verification states exposed to the UI. The backend currently
 * returns `isVerified: boolean`, so "Pending" and "Rejected" come from
 * separate flags the backend may add later. We keep the union here so
 * the UI can already render all four states cleanly.
 */
export type DriverLicenseVerificationState = "NotSubmitted" | "Pending" | "Verified" | "Rejected";

/**
 * Mirrors `DriverLicenseStatusResponse` returned by the backend
 * (`GET /api/driver-license/me`). Field names match the JSON casing
 * produced by ASP.NET Core's default serializer (camelCase).
 */
export interface DriverLicenseDto {
  readonly id: string;
  readonly userId: string;
  readonly licenseNumber: string;
  readonly licenseExpiryDate: string;
  readonly licenseImageUrl: string | null;
  readonly isVerified: boolean;
  readonly submittedAt: string;
  readonly updatedAt: string | null;
  /** Server-provided rejection reason, if any. Optional / future-proofing. */
  readonly rejectionReason?: string | null;
  /** Optional richer state when backend exposes Pending/Rejected explicitly. */
  readonly verificationState?: DriverLicenseVerificationState;
}

interface RawDriverLicenseDto {
  id?: string;
  Id?: string;
  userId?: string;
  UserId?: string;
  licenseNumber?: string;
  LicenseNumber?: string;
  licenseExpiryDate?: string;
  LicenseExpiryDate?: string;
  licenseImageUrl?: string | null;
  LicenseImageUrl?: string | null;
  isVerified?: boolean;
  IsVerified?: boolean;
  submittedAt?: string;
  SubmittedAt?: string;
  updatedAt?: string | null;
  UpdatedAt?: string | null;
  rejectionReason?: string | null;
  RejectionReason?: string | null;
  verificationState?: DriverLicenseVerificationState;
  VerificationState?: DriverLicenseVerificationState;
  status?: string;
  Status?: string;
}

function normalize(raw: RawDriverLicenseDto): DriverLicenseDto {
  const isVerified = raw.isVerified ?? raw.IsVerified ?? false;

  // Prefer an explicit verificationState/status if backend provides one;
  // otherwise derive from the boolean flag.
  const rawState = (raw.verificationState ?? raw.VerificationState ?? raw.status ?? raw.Status) as
    | DriverLicenseVerificationState
    | undefined;

  return {
    id: raw.id ?? raw.Id ?? "",
    userId: raw.userId ?? raw.UserId ?? "",
    licenseNumber: raw.licenseNumber ?? raw.LicenseNumber ?? "",
    licenseExpiryDate: raw.licenseExpiryDate ?? raw.LicenseExpiryDate ?? "",
    licenseImageUrl: raw.licenseImageUrl ?? raw.LicenseImageUrl ?? null,
    isVerified,
    submittedAt: raw.submittedAt ?? raw.SubmittedAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? null,
    rejectionReason: raw.rejectionReason ?? raw.RejectionReason ?? null,
    verificationState: rawState ?? (isVerified ? "Verified" : "Pending"),
  };
}

/**
 * GET /api/driver-license/me
 * Returns null when the user has never submitted a driver license (404).
 */
export async function getMyDriverLicense(accessToken: string): Promise<DriverLicenseDto | null> {
  try {
    const raw = await apiFetchJson<RawDriverLicenseDto>("/api/driver-license/me", {
      method: "GET",
      accessToken,
    });
    return normalize(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface SubmitDriverLicenseInput {
  readonly licenseNumber: string;
  /** ISO date string (yyyy-MM-dd or full ISO). */
  readonly licenseExpiryDate: string;
  readonly licenseImage: File;
}

/**
 * POST /api/driver-license  (multipart/form-data)
 * Field names match the backend `SubmitDriverLicenseRequest` record.
 */
export async function submitDriverLicense(
  accessToken: string,
  input: SubmitDriverLicenseInput
): Promise<DriverLicenseDto> {
  const formData = new FormData();
  formData.append("LicenseNumber", input.licenseNumber);
  formData.append("LicenseExpiryDate", input.licenseExpiryDate);
  formData.append("LicenseImage", input.licenseImage);

  const raw = await apiFetchJson<RawDriverLicenseDto>("/api/driver-license", {
    method: "POST",
    accessToken,
    body: formData,
  });
  return normalize(raw);
}
