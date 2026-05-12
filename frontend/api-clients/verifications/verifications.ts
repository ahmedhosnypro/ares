import { apiFetchJson, ApiError } from "@/utils/api-client";

export type VerificationDocumentType = "NationalID" | "Passport";

export type VerificationRequestStatus = "Pending" | "Approved" | "Rejected";

/**
 * Mirrors `UserVerificationDto` returned by the backend.
 * Status / DocumentType are typed as `string` because the backend may also
 * surface "NotVerified" or any future value; consumers narrow as needed.
 */
export interface UserVerificationDto {
  readonly status: string;
  readonly documentType: string;
  readonly submittedAt: string;
  readonly rejectionReason: string | null;
}

interface RawUserVerificationDto {
  status?: string;
  Status?: string;
  documentType?: string;
  DocumentType?: string;
  submittedAt?: string;
  SubmittedAt?: string;
  rejectionReason?: string | null;
  RejectionReason?: string | null;
}

function normalizeVerificationDto(raw: RawUserVerificationDto): UserVerificationDto {
  return {
    status: raw.status ?? raw.Status ?? "Pending",
    documentType: raw.documentType ?? raw.DocumentType ?? "",
    submittedAt: raw.submittedAt ?? raw.SubmittedAt ?? new Date().toISOString(),
    rejectionReason: raw.rejectionReason ?? raw.RejectionReason ?? null,
  };
}

/**
 * GET /api/verifications/me
 * Returns null if the user has never submitted a verification request (404).
 */
export async function getMyVerification(accessToken: string): Promise<UserVerificationDto | null> {
  try {
    const raw = await apiFetchJson<RawUserVerificationDto>("/api/verifications/me", {
      method: "GET",
      accessToken,
    });
    return normalizeVerificationDto(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface SubmitVerificationInput {
  readonly documentType: VerificationDocumentType;
  readonly frontImage: File;
  readonly backImage?: File | null;
}

/**
 * POST /api/verifications  (multipart/form-data)
 * Field names match the backend `SubmitVerificationRequest` record.
 */
export async function submitVerification(
  accessToken: string,
  input: SubmitVerificationInput
): Promise<UserVerificationDto> {
  const formData = new FormData();
  formData.append("DocumentType", input.documentType);
  formData.append("FrontImage", input.frontImage);
  if (input.backImage) {
    formData.append("BackImage", input.backImage);
  }

  const raw = await apiFetchJson<RawUserVerificationDto>("/api/verifications", {
    method: "POST",
    accessToken,
    body: formData,
  });
  return normalizeVerificationDto(raw);
}
