"use client";

import { useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import type { DriverEarningRow } from "@/api-clients/driver-earnings/driver-earnings";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusChipColor(status: string): "success" | "warning" | "info" | "error" {
  switch (status) {
    case "Available":
      return "success";
    case "PendingPayout":
      return "warning";
    case "Paid":
      return "info";
    case "Reversed":
      return "error";
    default:
      return "info";
  }
}

function formatStatusLabel(status: string, labels: Map<string, string>): string {
  const key = status.charAt(0).toLowerCase() + status.slice(1);
  return labels.get(key) ?? status;
}

interface EarningsHistoryTableProps {
  readonly rows: DriverEarningRow[] | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly labels: {
    readonly date: string;
    readonly bookingId: string;
    readonly grossEarning: string;
    readonly platformDeduction: string;
    readonly netEarning: string;
    readonly status: string;
    readonly page: string;
    readonly of: string;
    readonly available: string;
    readonly pendingPayoutStatus: string;
    readonly paid: string;
    readonly reversed: string;
  };
}

function formatDate(iso: string, locale: string): string {
  return formatUtcDate(iso, locale, { year: "numeric", month: "short", day: "numeric" }, iso);
}

export default function EarningsHistoryTable({
  rows,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  labels,
}: EarningsHistoryTableProps) {
  const locale = useLocale();
  const handlePrev = useCallback(() => {
    onPageChange(Math.max(1, page - 1));
  }, [page, onPageChange]);

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, page + 1));
  }, [page, totalPages, onPageChange]);

  const statusLabels = new Map<string, string>([
    ["available", labels.available],
    ["pendingPayout", labels.pendingPayoutStatus],
    ["paid", labels.paid],
    ["reversed", labels.reversed],
  ]);

  if (error) {
    return (
      <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Earnings History
          </Typography>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Earnings History
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.date}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.bookingId}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.grossEarning}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.platformDeduction}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.netEarning}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{labels.status}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows && rows.length > 0 ? (
                    rows.map(row => (
                      <TableRow key={row.bookingId} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell>{formatDate(row.completedAt, locale)}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>{row.bookingNumber}</TableCell>
                        <TableCell>{formatCurrency(row.grossEarning)}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>-{formatCurrency(row.platformDeduction)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(row.netEarning)}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatusLabel(row.status, statusLabels)}
                            size="small"
                            color={getStatusChipColor(row.status)}
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No earnings history yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mt: 2, gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {labels.page} {page} {labels.of} {totalPages}
                </Typography>
                <IconButton size="small" onClick={handlePrev} disabled={page <= 1}>
                  <NavigateBeforeIcon />
                </IconButton>
                <IconButton size="small" onClick={handleNext} disabled={page >= totalPages}>
                  <NavigateNextIcon />
                </IconButton>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
