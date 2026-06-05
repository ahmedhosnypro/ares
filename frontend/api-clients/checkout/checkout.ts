import { toApiUrl } from "@/utils/api-client";

/**
 * Typed client for the staged checkout lifecycle (double-booking prevention):
 *   Draft → DriverSelected → PaymentPending (vehicle held) → Confirmed.
 *
 * Every step is persisted server-side, so the funnel can be recovered after a
 * refresh, lost connection or error via {@link getActiveCheckout} /
 * {@link getCheckoutState}. The backend is the single source of truth for
 * availability — these calls can return 409 when a vehicle was just taken.
 */

export type CheckoutStatus =
  | "Draft"
  | "DriverSelected"
  | "PaymentPending"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "Expired"
  | string;

/** Where the UI should resume the funnel for a given booking. */
export type CheckoutStep = "vehicle" | "driver" | "payment" | "confirmed";

export interface CheckoutState {
  bookingId: string;
  bookingNumber?: string | null;
  status: CheckoutStatus;
  step: CheckoutStep;
  vehicleId: string;
  vehicleLabel: string;
  vehicleImageUrl?: string | null;
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  totalDays: number;
  vehicleFee: number;
  requiresDriver: boolean;
  driverProfileId?: string | null;
  driverName?: string | null;
  driverFee?: number | null;
  grandTotal: number;
  holdExpiresAt?: string | null;
  holdSecondsRemaining?: number | null;
}

export interface CreateDraftPayload {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocationId?: string;
  dropOffLocationId?: string;
  pickupLocation?: string | null;
  dropOffLocation?: string | null;
}

export interface SelectDriverPayload {
  needDriver: boolean;
  driverProfileId?: string | null;
}

export interface ConfirmPayload {
  paymentMethod?: string;
  paymentMethodId?: string | null;
}

/** Error thrown by the checkout client, exposing the HTTP status (e.g. 409). */
export class CheckoutError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "CheckoutError";
  }

  /** True when the vehicle was just reserved by someone else. */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

interface ErrorBody {
  message?: string;
  validationErrors?: { message?: string }[];
}

async function call<T>(endpoint: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(toApiUrl(endpoint), { ...init, headers, cache: "no-store" });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null;
    const message = body?.validationErrors?.[0]?.message ?? body?.message ?? "Something went wrong. Please try again.";
    throw new CheckoutError(res.status, message);
  }

  return (await res.json()) as T;
}

/** Step 1 — create (or resume) a DRAFT. Does not reserve the vehicle. */
export function createDraft(payload: CreateDraftPayload, accessToken: string): Promise<CheckoutState> {
  return call<CheckoutState>("/api/checkout/draft", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Step 2 — record the driver choice (DRIVER_SELECTED). */
export function selectDriver(
  bookingId: string,
  payload: SelectDriverPayload,
  accessToken: string
): Promise<CheckoutState> {
  return call<CheckoutState>(`/api/checkout/${bookingId}/driver`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Step 3 — enter payment: place the time-boxed hold (PAYMENT_PENDING). May 409. */
export function beginPayment(bookingId: string, accessToken: string): Promise<CheckoutState> {
  return call<CheckoutState>(`/api/checkout/${bookingId}/payment`, accessToken, { method: "POST" });
}

/** Step 4 — confirm: capture payment and finalise (CONFIRMED). */
export function confirmCheckout(
  bookingId: string,
  payload: ConfirmPayload,
  accessToken: string
): Promise<{ bookingId: string; bookingNumber: string; status: string; totalPrice: number; message: string }> {
  return call(`/api/checkout/${bookingId}/confirm`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Cancel an in-flight checkout and release any hold. */
export function cancelCheckout(bookingId: string, accessToken: string): Promise<CheckoutState> {
  return call<CheckoutState>(`/api/checkout/${bookingId}/cancel`, accessToken, { method: "POST" });
}

/** Booking recovery — the caller's current resumable checkout, or null if none. */
export async function getActiveCheckout(accessToken: string): Promise<CheckoutState | null> {
  const result = await call<CheckoutState | undefined>("/api/checkout/active", accessToken, { method: "GET" });
  return result ?? null;
}

/** Booking recovery — checkout state for a specific booking, or null if not found. */
export async function getCheckoutState(bookingId: string, accessToken: string): Promise<CheckoutState | null> {
  try {
    return await call<CheckoutState>(`/api/checkout/${bookingId}`, accessToken, { method: "GET" });
  } catch (e) {
    if (e instanceof CheckoutError && e.status === 404) return null;
    throw e;
  }
}

/** Maps a checkout {@link CheckoutStep} to the route that renders it. */
export function checkoutStepHref(state: CheckoutState): string {
  switch (state.step) {
    case "driver":
      return `/booking/driver-selection/${state.vehicleId}`;
    case "payment":
      return `/booking/payment/${state.bookingId}`;
    case "confirmed":
      return `/bookings/confirmation/${state.bookingId}`;
    default:
      return `/vehicles/${state.vehicleId}`;
  }
}
