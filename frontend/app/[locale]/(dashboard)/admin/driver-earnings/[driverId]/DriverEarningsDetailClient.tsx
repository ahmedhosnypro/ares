"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { Theme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import VehicleStats, { type StatItem } from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import {
  type AdminDriverEarningsOverview,
  type DriverEarningRow,
  getAdminDriverEarningsHistory,
  getAdminDriverEarningsOverview,
} from "@/api-clients/admin-driver-earnings/admin-driver-earnings";
import { logger } from "@/utils/logger";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function getEarningStatusColor(status: string, theme: Theme): string {
  const s = status.toLowerCase();
  if (s === "completed") return theme.palette.success.main;
  if (s === "cancelled") return theme.palette.error.main;
  if (s === "pending") return theme.palette.warning.main;
  return theme.palette.info.main;
}

export default function DriverEarningsDetailClient() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const driverId = Array.isArray(params.driverId) ? params.driverId[0] : (params.driverId as string);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;

  const [overview, setOverview] = useState<AdminDriverEarningsOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [earnings, setEarnings] = useState<DriverEarningRow[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const [earningsPage, setEarningsPage] = useState(1);
  const PAGE_SIZE = 20;

  const [toast, setToast] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  const fetchOverview = useCallback(async () => {
    if (!accessToken || !driverId) return;
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const data = await getAdminDriverEarningsOverview(driverId, accessToken);
      setOverview(data);
    } catch (err) {
      logger.error("Failed to load driver earnings overview", err);
      setOverviewError("Could not load driver earnings overview.");
    } finally {
      setOverviewLoading(false);
    }
  }, [accessToken, driverId]);

  const fetchEarnings = useCallback(async () => {
    if (!accessToken || !driverId) return;
    try {
      setEarningsLoading(true);
      const data = await getAdminDriverEarningsHistory(driverId, accessToken, earningsPage, PAGE_SIZE);
      setEarnings(data);
    } catch (err) {
      logger.error("Failed to load driver earnings history", err);
    } finally {
      setEarningsLoading(false);
    }
  }, [accessToken, driverId, earningsPage]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    void fetchOverview();
  }, [fetchOverview, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    void fetchEarnings();
  }, [fetchEarnings, sessionStatus]);

  const overviewStatsItems = useMemo<readonly StatItem[]>(
    () => [
      {
        label: "Total Earnings",
        value: overview ? formatCurrency(safeNum(overview.totalEarnings)) : "—",
        subtitle: "Lifetime earnings",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
      {
        label: "Available Balance",
        value: overview ? formatCurrency(safeNum(overview.availableBalance)) : "—",
        subtitle: overview?.isWalletVerified ? "Wallet verified" : "Wallet not verified",
        icon: <AccountBalanceWalletOutlinedIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: "Paid Out",
        value: overview ? formatCurrency(safeNum(overview.paidOutAmount)) : "—",
        subtitle: `Pending: ${overview ? formatCurrency(safeNum(overview.pendingPayoutAmount)) : "—"}`,
        icon: <PaymentsOutlinedIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: "Completed Trips",
        value: overview ? String(overview.completedTripsCount) : "—",
        subtitle: overview?.hasPaymentInfo ? "Payment info on file" : "No payment info",
        icon: <DirectionsCarFilledOutlinedIcon fontSize="medium" />,
        color: "warning",
      },
    ],
    [overview]
  );

  if (overviewLoading && !overview) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (overviewError || (!overview && !overviewLoading)) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Alert severity="error">{overviewError ?? "Driver earnings not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/admin/driver-earnings");
          }}
        >
          Back to Driver Earnings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          gap: 2,
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 4,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <IconButton
            onClick={() => {
              router.push("/admin/driver-earnings");
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              {overview?.profilePictureUrl ? (
                <Avatar src={overview.profilePictureUrl} sx={{ width: 40, height: 40 }} />
              ) : (
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                    fontWeight: 700,
                    width: 40,
                    height: 40,
                  }}
                >
                  {overview?.driverName[0] ?? "?"}
                </Avatar>
              )}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: {
                    xs: "1.5rem",
                    sm: "2rem",
                    md: "2.125rem",
                  },
                }}
              >
                {overview?.driverName ?? "Driver"} — Earnings
              </Typography>
            </Stack>
            <Typography color="text.secondary" variant="body2">
              Per-driver earnings overview and history
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Refresh data">
          <IconButton
            onClick={() => {
              void fetchOverview();
              void fetchEarnings();
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <VehicleStats items={overviewStatsItems} loading={overviewLoading} />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Earnings History
              </Typography>

              {earningsLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 1 }} />
                  ))}
                </Stack>
              ) : earnings.length === 0 ? (
                <Box
                  sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <DirectionsCarFilledOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No earnings history found
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table>
                      <TableHead
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      >
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Booking #</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Completed</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Gross
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Deduction
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Net
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {earnings.map(row => {
                          const statusColor = getEarningStatusColor(row.status, theme);
                          return (
                            <TableRow
                              key={row.bookingId}
                              hover
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {row.bookingNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{formatDate(row.completedAt)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(row.grossEarning)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">
                                  -{formatCurrency(row.platformDeduction)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {formatCurrency(row.netEarning)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.status}
                                  size="small"
                                  sx={{
                                    textTransform: "capitalize",
                                    bgcolor: alpha(statusColor, 0.15),
                                    color: statusColor,
                                    fontWeight: 700,
                                    fontSize: 12,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {earnings.length >= PAGE_SIZE && (
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      <Button
                        size="small"
                        disabled={earningsPage <= 1}
                        onClick={() => {
                          setEarningsPage(p => p - 1);
                        }}
                      >
                        Previous
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Page {earningsPage}
                      </Typography>
                      <Button
                        size="small"
                        disabled={earnings.length < PAGE_SIZE}
                        onClick={() => {
                          setEarningsPage(p => p + 1);
                        }}
                      >
                        Next
                      </Button>
                    </Stack>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => {
          setToast(t => ({ ...t, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
