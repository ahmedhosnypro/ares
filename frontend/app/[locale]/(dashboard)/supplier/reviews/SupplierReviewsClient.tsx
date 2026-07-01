"use client";

/**
 * Supplier Reviews page (`/supplier/reviews`).
 *
 * Mirrors the visual language of the existing supplier vehicles list
 * (`app/supplier/vehicles/SupplierVehiclesClient.tsx`) — same MUI table,
 * chip styling, pagination, snackbar, and filter row — so the reviews
 * tab feels like a natural sibling of the rest of the supplier portal.
 *
 * Backend endpoints (all gated to `Supplier` role, supplier-id resolved
 * from the JWT — see `SupplierReviewsController.cs`):
 *
 *   - GET    /api/supplier/reviews              → paginated list
 *   - GET    /api/supplier/reviews/statistics   → aggregate stats
 *   - PUT    /api/supplier/reviews/{id}/reply   → save reply (idempotent)
 *   - POST   /api/supplier/reviews/{id}/report  → report inappropriate
 *
 * Suppliers can VIEW, REPLY (edit overwrites), and REPORT. They cannot
 * delete or modify customer-authored fields — those endpoints are not
 * exposed on the supplier controller and no UI surface is rendered.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChatBubbleOutlineRounded as ReplyIcon,
  EditRounded as EditIcon,
  RateReviewRounded as ReviewIcon,
  ReportProblemRounded as ReportIcon,
  LaunchOutlined as ViewIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  StarRounded as StarIcon,
  EmojiEventsRounded as TopRatedIcon,
  HourglassTopRounded as PendingIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDateTime } from "@/utils/dateTime";

import {
  getSupplierReviews,
  getSupplierReviewStatistics,
  reportSupplierReview,
  saveSupplierReply,
  type PagedResult,
  type SupplierReviewListItem,
  type SupplierReviewListQuery,
  type SupplierReviewReplyStatus,
  type SupplierReviewSortBy,
  type SupplierReviewStatistics,
} from "@/api-clients/supplier-reviews/supplier-reviews";
import { getSupplierVehicles, type SupplierVehicleListItem } from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import RatingStars from "./_components/RatingStars";
import ReplyReviewDialog from "./_components/ReplyReviewDialog";
import ReportReviewDialog from "./_components/ReportReviewDialog";
import ReviewDetailsDialog from "./_components/ReviewDetailsDialog";
import VehicleStats from "@/app/[locale]/(dashboard)/_components/VehicleStats";

// ── Filter dropdown options — kept in sync with the backend ──────────────────

const REPLY_STATUS_VALUES: readonly { labelKey: string; value: SupplierReviewReplyStatus }[] = [
  { labelKey: "filters.allReplies", value: "" },
  { labelKey: "filters.replied", value: "replied" },
  { labelKey: "filters.notReplied", value: "unReplied".toLowerCase() as SupplierReviewReplyStatus },
];

const SORT_VALUES: readonly { labelKey: string; value: SupplierReviewSortBy }[] = [
  { labelKey: "filters.newestFirst", value: "newest" },
  { labelKey: "filters.oldestFirst", value: "oldest" },
  { labelKey: "filters.highestRating", value: "highest" },
  { labelKey: "filters.lowestRating", value: "lowest" },
];

const PAGE_SIZE = 10;
// Backend caps pageSize at 100 — fetch a generous slice for the vehicle
// dropdown so the supplier sees their whole fleet there.
const VEHICLE_DROPDOWN_PAGE_SIZE = 100;

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return formatUtcDateTime(iso, locale);
}

function truncate(value: string | null | undefined, max = 90): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}

export default function SupplierReviewsClient() {
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const t = useTranslations("dashboard.supplierReviews");

  // ── Filter state ────────────────────────────────────────────────────────────
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [replyStatusFilter, setReplyStatusFilter] = useState<SupplierReviewReplyStatus>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<SupplierReviewSortBy>("newest");
  const [page, setPage] = useState(1);

  // ── List + stats state ──────────────────────────────────────────────────────
  const [data, setData] = useState<PagedResult<SupplierReviewListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<SupplierReviewStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<SupplierVehicleListItem[]>([]);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [detailsTarget, setDetailsTarget] = useState<SupplierReviewListItem | null>(null);
  const [replyTarget, setReplyTarget] = useState<SupplierReviewListItem | null>(null);
  const [reportTarget, setReportTarget] = useState<SupplierReviewListItem | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const showToast = useCallback((message: string, severity: SnackbarState["severity"] = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Reset to page 1 whenever filters change so the user always lands on the
  // first results page.
  useEffect(() => {
    setPage(1);
  }, [vehicleFilter, ratingFilter, replyStatusFilter, fromDate, toDate, sortBy]);

  // ── Fetchers ────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    if (sessionStatus === "loading") return;
    const accessToken = session?.accessToken;
    if (!accessToken) {
      setLoading(false);
      setError(t("errors.notSignedInReviews"));
      return;
    }

    setLoading(true);
    setError(null);

    const query: SupplierReviewListQuery = {
      vehicleId: vehicleFilter || undefined,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
      replyStatus: replyStatusFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy,
      page,
      pageSize: PAGE_SIZE,
    };

    try {
      const result = await getSupplierReviews(accessToken, query);
      setData(result);
    } catch (err) {
      logger.error("Failed to load supplier reviews", err);
      setError(t("errors.loadReviewsFailed"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    session?.accessToken,
    sessionStatus,
    t,
    vehicleFilter,
    ratingFilter,
    replyStatusFilter,
    fromDate,
    toDate,
    sortBy,
    page,
  ]);

  const fetchStats = useCallback(async () => {
    if (sessionStatus === "loading") return;
    const accessToken = session?.accessToken;
    if (!accessToken) {
      setStatsLoading(false);
      setStatsError(t("errors.notSignedInStats"));
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    try {
      const result = await getSupplierReviewStatistics(accessToken);
      setStats(result);
    } catch (err) {
      logger.error("Failed to load supplier review stats", err);
      setStatsError(t("errors.loadStatsFailed"));
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [session?.accessToken, sessionStatus, t]);

  // Pull the supplier's vehicles for the filter dropdown.
  const fetchVehicles = useCallback(async () => {
    if (sessionStatus === "loading") return;
    const accessToken = session?.accessToken;
    if (!accessToken) return;
    try {
      const result = await getSupplierVehicles(accessToken, { pageSize: VEHICLE_DROPDOWN_PAGE_SIZE });
      setVehicles(result.data);
    } catch (err) {
      // Filter dropdown is non-blocking — log and continue.
      logger.error("Failed to load supplier vehicles for filter", err);
    }
  }, [session?.accessToken, sessionStatus]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  // ── Helpers used in handlers ────────────────────────────────────────────────
  const replaceLocalRow = useCallback((updated: SupplierReviewListItem) => {
    setData(prev =>
      prev
        ? {
            ...prev,
            data: prev.data.map(r => (r.reviewId === updated.reviewId ? updated : r)),
          }
        : prev
    );
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmitReply = useCallback(
    async (reviewId: string, replyText: string) => {
      const accessToken = session?.accessToken;
      if (!accessToken) return;
      setSubmittingReply(true);
      try {
        const updated = await saveSupplierReply(accessToken, reviewId, { reply: replyText });
        replaceLocalRow(updated);
        showToast(replyTarget?.hasReply ? t("toasts.replyUpdated") : t("toasts.replySubmitted"), "success");
        setReplyTarget(null);
        // Refresh stats — pendingReplies may have changed.
        void fetchStats();
      } catch (err) {
        logger.error("Failed to save supplier reply", err);
        const msg = err instanceof Error ? err.message : t("toasts.failedToSaveReply");
        showToast(msg, "error");
      } finally {
        setSubmittingReply(false);
      }
    },
    [session?.accessToken, replyTarget?.hasReply, replaceLocalRow, showToast, fetchStats, t]
  );

  const handleSubmitReport = useCallback(
    async (reviewId: string, reason: string) => {
      const accessToken = session?.accessToken;
      if (!accessToken) return;
      setSubmittingReport(true);
      try {
        const updated = await reportSupplierReview(accessToken, reviewId, { reason });
        replaceLocalRow(updated);
        showToast(reportTarget?.isReported ? t("toasts.reportUpdated") : t("toasts.reviewReported"), "success");
        setReportTarget(null);
      } catch (err) {
        logger.error("Failed to report supplier review", err);
        const msg = err instanceof Error ? err.message : t("toasts.failedToReportReview");
        showToast(msg, "error");
      } finally {
        setSubmittingReport(false);
      }
    },
    [session?.accessToken, reportTarget?.isReported, replaceLocalRow, showToast, t]
  );

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const filtersActive = useMemo(
    () => Boolean(vehicleFilter || ratingFilter || replyStatusFilter || fromDate || toDate),
    [vehicleFilter, ratingFilter, replyStatusFilter, fromDate, toDate]
  );

  const reviewStatsItems = useMemo(() => {
    let averageRatingStr = "—";
    if (stats) {
      averageRatingStr = Number.isFinite(stats.averageRating) ? stats.averageRating.toFixed(2) : "0.00";
    }

    return [
      {
        label: t("stats.averageRating"),
        value: averageRatingStr,
        color: "warning",
        icon: <StarIcon fontSize="medium" />,
        subtitle: t("stats.acrossAllVehicles"),
      },
      {
        label: t("stats.totalReviews"),
        value: stats ? Math.max(0, Math.trunc(stats.totalReviews || 0)).toLocaleString() : "—",
        color: "primary",
        icon: <ReviewIcon fontSize="medium" />,
        subtitle: t("stats.lifetimeCustomerReviews"),
      },
      {
        label: t("stats.fiveStarReviews"),
        value: stats ? Math.max(0, Math.trunc(stats.fiveStarReviews || 0)).toLocaleString() : "—",
        color: "success",
        icon: <TopRatedIcon fontSize="medium" />,
        subtitle: t("stats.topRatedBookings"),
      },
      {
        label: t("stats.pendingReplies"),
        value: stats ? Math.max(0, Math.trunc(stats.pendingReplies || 0)).toLocaleString() : "—",
        color: "info",
        icon: <PendingIcon fontSize="medium" />,
        subtitle: t("stats.reviewsAwaitingReply"),
      },
    ];
  }, [stats, t]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", mb: 3, alignItems: { xs: "flex-start", sm: "center" } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.6rem", md: "2rem" } }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("description")}
          </Typography>
        </Box>
      </Stack>

      {/* STATS */}
      {statsError && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          {statsError}
        </Alert>
      )}
      <VehicleStats items={reviewStatsItems} loading={statsLoading} />

      {/* FILTERS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("filters.vehicle")}
            value={vehicleFilter}
            onChange={e => {
              setVehicleFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">{t("filters.allVehicles")}</MenuItem>
            {vehicles.map(v => (
              <MenuItem key={v.vehicleId} value={v.vehicleId}>
                {v.make} {v.model}
                {v.year ? ` · ${String(v.year)}` : ""}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("filters.rating")}
            value={ratingFilter}
            onChange={e => {
              setRatingFilter(e.target.value);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">{t("filters.allRatings")}</MenuItem>
            <MenuItem value="5">{t("filters.fiveStars")}</MenuItem>
            <MenuItem value="4">{t("filters.fourStars")}</MenuItem>
            <MenuItem value="3">{t("filters.threeStars")}</MenuItem>
            <MenuItem value="2">{t("filters.twoStars")}</MenuItem>
            <MenuItem value="1">{t("filters.oneStar")}</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("filters.reply")}
            value={replyStatusFilter}
            onChange={e => {
              setReplyStatusFilter(e.target.value as SupplierReviewReplyStatus);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {REPLY_STATUS_VALUES.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label={t("filters.from")}
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label={t("filters.to")}
            value={toDate}
            onChange={e => {
              setToDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 1 }}>
          <TextField
            select
            fullWidth
            size="small"
            label={t("filters.sort")}
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as SupplierReviewSortBy);
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            {SORT_VALUES.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* INLINE LIST ERROR */}
      {error && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* CONTENT */}
      {(() => {
        if (loading) {
          return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          );
        }

        if (rows.length === 0) {
          return (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                py: 8,
                textAlign: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: thm => alpha(thm.palette.text.disabled, 0.1),
                }}
              >
                <ReviewIcon sx={{ fontSize: 32, color: "text.disabled" }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
                {filtersActive ? t("empty.noReviewsMatchFilters") : t("empty.noReviewsYet")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filtersActive ? t("empty.tryClearingFilters") : t("empty.reviewsWillAppear")}
              </Typography>
            </Paper>
          );
        }

        return (
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: isMobile ? 720 : 1000 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: thm => alpha(thm.palette.primary.main, 0.04),
                      "& .MuiTableCell-head": {
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "text.secondary",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell sx={{ pl: 3 }}>{t("table.customer")}</TableCell>
                    <TableCell>{t("table.vehicle")}</TableCell>
                    <TableCell>{t("table.rating")}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{t("table.comment")}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{t("table.date")}</TableCell>
                    <TableCell>{t("table.reply")}</TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      {t("table.actions")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(r => (
                    <ReviewTableRow
                      key={r.reviewId}
                      row={r}
                      onView={setDetailsTarget}
                      onReply={setReplyTarget}
                      onReport={setReportTarget}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                gap: 1,
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t("table.showing")} <strong>{rows.length}</strong> {t("table.of")} {totalCount} {t("table.reviews")}
              </Typography>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                  }}
                  size="small"
                  siblingCount={isMobile ? 0 : 1}
                  sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                />
              )}
            </Stack>
          </Paper>
        );
      })()}

      {/* MODALS */}
      <ReviewDetailsDialog
        open={Boolean(detailsTarget)}
        review={detailsTarget}
        onClose={() => {
          setDetailsTarget(null);
        }}
        onReply={r => {
          setDetailsTarget(null);
          setReplyTarget(r);
        }}
        onReport={r => {
          setDetailsTarget(null);
          setReportTarget(r);
        }}
      />

      <ReplyReviewDialog
        open={Boolean(replyTarget)}
        review={replyTarget}
        submitting={submittingReply}
        onClose={() => {
          if (!submittingReply) setReplyTarget(null);
        }}
        onSubmit={handleSubmitReply}
      />

      <ReportReviewDialog
        open={Boolean(reportTarget)}
        review={reportTarget}
        submitting={submittingReport}
        onClose={() => {
          if (!submittingReport) setReportTarget(null);
        }}
        onSubmit={handleSubmitReport}
      />

      {/* TOAST */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar(s => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ maxWidth: { xs: "calc(100% - 32px)", sm: "auto" } }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => {
            setSnackbar(s => ({ ...s, open: false }));
          }}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ── Row sub-component (kept inline to mirror SupplierVehiclesClient pattern) ─

interface ReviewTableRowProps {
  readonly row: SupplierReviewListItem;
  readonly onView: (r: SupplierReviewListItem) => void;
  readonly onReply: (r: SupplierReviewListItem) => void;
  readonly onReport: (r: SupplierReviewListItem) => void;
}

function ReviewTableRow({ row, onView, onReply, onReport }: ReviewTableRowProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.supplierReviews");
  const locale = useLocale();
  const vehicleImage = toImageUrl(row.vehicleImageUrl);

  return (
    <TableRow
      hover
      sx={{
        "&:last-child td": { border: 0 },
        "&:hover": { bgcolor: thm => alpha(thm.palette.primary.main, 0.03) },
      }}
    >
      <TableCell sx={{ py: 1.8, pl: 3 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              width: 36,
              height: 36,
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {(row.customerName || "C").trim().charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
              {row.customerName || t("table.customerDefault")}
            </Typography>
            {row.isReported && (
              <Chip
                size="small"
                label={t("table.reported")}
                sx={{
                  mt: 0.25,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 18,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                  color: "error.main",
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
              bgcolor: thm => alpha(thm.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {vehicleImage ? (
              <Image
                src={vehicleImage}
                alt={`${row.vehicleMake} ${row.vehicleModel}`}
                width={88}
                height={88}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <CarIcon fontSize="small" />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
              {row.vehicleMake} {row.vehicleModel}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.vehicleYear ? String(row.vehicleYear) : "—"}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <RatingStars rating={row.rating} size="small" />
      </TableCell>

      <TableCell sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 320 }}>
        <Typography variant="body2" color={row.comment ? "text.primary" : "text.disabled"}>
          {row.comment ? truncate(row.comment) : t("table.noComment")}
        </Typography>
      </TableCell>

      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(row.createdAt, locale)}
        </Typography>
      </TableCell>

      <TableCell sx={{ maxWidth: { xs: "auto", md: 280 } }}>
        {row.hasReply ? (
          <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
            <Chip
              size="small"
              label={t("table.replied")}
              sx={{
                fontWeight: 700,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: "success.main",
                borderRadius: 1.5,
              }}
            />
            {row.supplierReply && (
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                {truncate(row.supplierReply, 60)}
              </Typography>
            )}
          </Stack>
        ) : (
          <Chip
            size="small"
            label={t("table.pending")}
            sx={{
              fontWeight: 700,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
              borderRadius: 1.5,
            }}
          />
        )}
      </TableCell>

      <TableCell align="right" sx={{ pr: 3 }}>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
          <Tooltip title={t("table.viewDetails")}>
            <IconButton
              size="small"
              sx={{ borderRadius: 2 }}
              onClick={() => {
                onView(row);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.hasReply ? t("table.editReply") : t("table.replyAction")}>
            <IconButton
              size="small"
              sx={{
                borderRadius: 2,
                color: row.hasReply ? "primary.main" : "text.secondary",
              }}
              onClick={() => {
                onReply(row);
              }}
            >
              {row.hasReply ? <EditIcon fontSize="small" /> : <ReplyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={row.isReported ? t("table.updateReport") : t("table.reportReview")}>
            <IconButton
              size="small"
              sx={{
                borderRadius: 2,
                color: row.isReported ? "error.main" : "text.secondary",
                "&:hover": {
                  bgcolor: thm => alpha(thm.palette.error.main, 0.1),
                  color: "error.main",
                },
              }}
              onClick={() => {
                onReport(row);
              }}
            >
              <ReportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
