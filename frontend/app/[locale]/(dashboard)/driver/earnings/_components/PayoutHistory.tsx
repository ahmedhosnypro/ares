"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import type { DriverPayout } from "@/api-clients/driver-earnings/driver-earnings";
import { useLocale } from "next-intl";

import { formatUtcDate } from "@/utils/dateTime";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string, locale: string): string {
  return formatUtcDate(iso, locale, { year: "numeric", month: "short", day: "numeric" }, iso);
}

function getPayoutChipColor(status: string): "warning" | "info" | "success" | "error" {
  switch (status) {
    case "Requested":
      return "warning";
    case "Approved":
    case "Processing":
      return "info";
    case "Completed":
      return "success";
    case "Rejected":
    case "Failed":
      return "error";
    default:
      return "info";
  }
}

interface PayoutHistoryProps {
  readonly payouts: DriverPayout[] | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly labels: {
    readonly payoutHistory: string;
    readonly noPayoutHistory: string;
    readonly requested: string;
    readonly approved: string;
    readonly processing: string;
    readonly completed: string;
    readonly rejected: string;
    readonly failed: string;
  };
}

const STATUS_LABELS_MAP = new Map<string, string>([
  ["Requested", "requested"],
  ["Approved", "approved"],
  ["Processing", "processing"],
  ["Completed", "completed"],
  ["Rejected", "rejected"],
  ["Failed", "failed"],
]);

function resolveStatusLabel(status: string, labels: PayoutHistoryProps["labels"]): string {
  const key = STATUS_LABELS_MAP.get(status);
  if (!key) return status;
  return labels[key as keyof PayoutHistoryProps["labels"]];
}

export default function PayoutHistory({ payouts, loading, error, labels }: PayoutHistoryProps) {
  const locale = useLocale();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <PaymentsOutlinedIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {labels.payoutHistory}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : payouts && payouts.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {payouts.map(payout => (
              <Accordion
                key={payout.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      pr: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(payout.amount)}
                      </Typography>
                      <Chip
                        label={resolveStatusLabel(payout.status, labels)}
                        size="small"
                        color={getPayoutChipColor(payout.status)}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(payout.requestedAt, locale)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, px: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Requested: {formatDate(payout.requestedAt, locale)}
                    </Typography>
                    {payout.reviewedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Reviewed: {formatDate(payout.reviewedAt, locale)}
                      </Typography>
                    )}
                    {payout.completedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Completed: {formatDate(payout.completedAt, locale)}
                      </Typography>
                    )}
                    {payout.rejectionReason && (
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Reason: {payout.rejectionReason}
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              py: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              textAlign: "center",
            }}
          >
            <PaymentsOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {labels.noPayoutHistory}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
