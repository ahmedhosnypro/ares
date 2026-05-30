"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getMyVerification, type UserVerificationDto } from "@/api-clients/verifications/verifications";
import { logger } from "@/utils/logger";

/**
 * Possible verification states surfaced to the UI.
 *
 * `NotSubmitted` — the user has never submitted a verification request
 *   (backend returns 404 for `/api/verifications/me`).
 * `Pending` | `Approved` | `Rejected` — values stored on
 *   `Verification.Status` server-side. Casing follows the backend
 *   (`VerificationRequestStatus.ToString()`).
 */
export type VerificationStatus = "NotSubmitted" | "Pending" | "Approved" | "Rejected";

export interface VerificationStatusState {
  /** Loaded state for the verification record itself. */
  readonly loading: boolean;
  /** Discriminated status value — null only while `loading` is true. */
  readonly status: VerificationStatus | null;
  /** Raw DTO from the backend, when one exists. */
  readonly record: UserVerificationDto | null;
  /** True iff `status === "Approved"`. Convenience for booking gates. */
  readonly isApproved: boolean;
  /** Surface any unexpected fetch failure (network / 5xx). */
  readonly error: string | null;
}

const INITIAL_STATE: VerificationStatusState = {
  loading: true,
  status: null,
  record: null,
  isApproved: false,
  error: null,
};

const SIGNED_OUT_STATE: VerificationStatusState = {
  loading: false,
  status: "NotSubmitted",
  record: null,
  isApproved: false,
  error: null,
};

/**
 * Client-side hook that fetches the current user's identity verification
 * status via `GET /api/verifications/me` and shapes the response for
 * gate-style consumers (booking page, etc).
 *
 * The hook is signed-in-aware:
 *   - while NextAuth is still resolving the session, returns
 *     `{ loading: true }` so callers can render a skeleton.
 *   - if no session exists, returns `{ status: "NotSubmitted", isApproved: false }`
 *     so the caller can route guests to sign-in or display the warning card.
 *   - a 404 from the backend resolves to `status: "NotSubmitted"` (the
 *     normalised api-client already maps it to `null`).
 *   - any other failure surfaces via `error` and `status` stays null —
 *     callers should treat that as "block, but show error".
 */
export function useVerificationStatus(): VerificationStatusState {
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<VerificationStatusState>(INITIAL_STATE);

  useEffect(() => {
    if (sessionStatus === "loading") {
      setState(INITIAL_STATE);
      return;
    }

    const accessToken = session?.accessToken;
    if (!accessToken) {
      setState(SIGNED_OUT_STATE);
      return;
    }

    const abortState = { cancelled: false };
    setState(prev => ({ ...prev, loading: true, error: null }));

    void (async () => {
      try {
        const record = await getMyVerification(accessToken);
        if (abortState.cancelled) return;

        if (record === null) {
          setState({
            loading: false,
            status: "NotSubmitted",
            record: null,
            isApproved: false,
            error: null,
          });
          return;
        }

        const normalisedStatus = normaliseStatus(record.status);
        setState({
          loading: false,
          status: normalisedStatus,
          record,
          isApproved: normalisedStatus === "Approved",
          error: null,
        });
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load identity verification status", err);
        setState({
          loading: false,
          status: null,
          record: null,
          isApproved: false,
          error: "Could not check your verification status. Please try again shortly.",
        });
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [session?.accessToken, sessionStatus]);

  return state;
}

/**
 * Case-insensitive normaliser — the backend writes PascalCase
 * ("Approved"), but defending against future API drift keeps this hook
 * robust.
 */
function normaliseStatus(raw: string): VerificationStatus {
  const lower = raw.trim().toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "pending") return "Pending";
  if (lower === "rejected") return "Rejected";
  return "NotSubmitted";
}
