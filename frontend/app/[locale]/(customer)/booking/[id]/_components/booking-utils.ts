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
  searchParams: Record<string, SearchParamValue>,
  t: (key: string) => string
): { severity: AlertColor; message: string } | undefined {
  const notice = firstValue(searchParams.notice);
  if (notice === "cancelled") {
    return {
      severity: "success",
      message: t("feedback.cancelled"),
    };
  }

  const error = firstValue(searchParams.error);
  switch (error) {
    case "not-eligible":
      return {
        severity: "error",
        message: t("feedback.notEligible"),
      };
    case "forbidden":
      return {
        severity: "error",
        message: t("feedback.forbidden"),
      };
    case "not-found":
      return {
        severity: "error",
        message: t("feedback.notFound"),
      };
    case "invalid-booking":
      return {
        severity: "error",
        message: t("feedback.invalidBooking"),
      };
    case "cancel-failed":
      return {
        severity: "error",
        message: t("feedback.cancelFailed"),
      };
    default:
      return undefined;
  }
}
