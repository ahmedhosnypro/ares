import { type AlertColor } from "@mui/material";

export type SearchParamValue = string | string[] | undefined;

export function firstValue(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function canCancelBooking(status?: string): boolean {
  const normalizedStatus = status?.toLowerCase();
  return normalizedStatus !== "cancelled" && normalizedStatus !== "completed";
}

export function getFeedback(
  searchParams: Record<string, SearchParamValue>
): { severity: AlertColor; message: string } | undefined {
  const notice = firstValue(searchParams.notice);
  if (notice === "cancelled") {
    return {
      severity: "success",
      message: "Booking cancelled successfully.",
    };
  }

  const error = firstValue(searchParams.error);
  switch (error) {
    case "not-eligible":
      return {
        severity: "error",
        message: "This booking cannot be cancelled in its current status.",
      };
    case "forbidden":
      return {
        severity: "error",
        message: "You are not allowed to cancel this booking.",
      };
    case "not-found":
      return {
        severity: "error",
        message: "Booking not found.",
      };
    case "invalid-booking":
      return {
        severity: "error",
        message: "Invalid booking reference.",
      };
    case "cancel-failed":
      return {
        severity: "error",
        message: "Unable to cancel booking right now. Please try again.",
      };
    default:
      return undefined;
  }
}
