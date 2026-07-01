"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  LinearProgress,
  Button,
  alpha,
  Tooltip,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Pagination,
  Card,
  useTheme,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  SearchRounded as SearchIcon,
  VisibilityRounded as ViewIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  LocalOfferTwoTone as OfferIcon,
  CheckCircleTwoTone as ActiveIcon,
  CancelTwoTone as InactiveIcon,
  BarChartTwoTone as AnalyticsIcon,
  FlashOffTwoTone as ExpiredIcon,
  NumbersTwoTone as UsageIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDate, parseUtcDate } from "@/utils/dateTime";
import { ApiError } from "@/utils/api-client";
import {
  getDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
  type DiscountCodeResponse,
} from "@/api-clients/promotions/promotions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function getDiscountStatus(discount: DiscountCodeResponse): "active" | "expired" | "inactive" {
  if (!discount.isActive) return "inactive";
  const now = new Date();
  const validTo = parseUtcDate(discount.validTo);
  if (validTo < now) return "expired";
  return "active";
}

function EmptyState({
  filtersActive,
  handleClearFilters,
  t,
}: {
  readonly filtersActive: boolean;
  readonly handleClearFilters: () => void;
  readonly t: (key: string) => string;
}) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Avatar
        sx={{
          width: 64,
          height: 64,
          mx: "auto",
          mb: 2,
          bgcolor: theme => alpha(theme.palette.text.disabled, 0.1),
        }}
      >
        <OfferIcon sx={{ fontSize: 32, color: "text.disabled" }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
        {filtersActive ? "No matching discounts" : t("emptyState")}
      </Typography>
      {filtersActive && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleClearFilters}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", mt: 2 }}
        >
          Clear Filters
        </Button>
      )}
    </Box>
  );
}

export default function AdminPromotionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.promotions");
  const locale = useLocale();

  const [discounts, setDiscounts] = useState<DiscountCodeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.accessToken ?? "";
      const res = await getDiscountCodes(
        {
          status: statusFilter || undefined,
          page,
          pageSize,
        },
        token
      );
      setDiscounts(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      setError("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  }, [session, statusFilter, page, pageSize]);

  useEffect(() => {
    if (session?.accessToken) {
      void fetchDiscounts();
    }
  }, [session, fetchDiscounts]);

  const filteredDiscounts = useMemo(() => {
    let result = discounts;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(d => d.code.toLowerCase().includes(term) || d.description.toLowerCase().includes(term));
    }
    return result;
  }, [discounts, debouncedSearch]);

  const activeCount = useMemo(() => discounts.filter(d => getDiscountStatus(d) === "active").length, [discounts]);
  const expiredCount = useMemo(() => discounts.filter(d => getDiscountStatus(d) === "expired").length, [discounts]);
  const totalUsage = useMemo(() => discounts.reduce((sum, d) => sum + d.currentUsageCount, 0), [discounts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirmMessage"))) return;
    try {
      const token = session?.accessToken ?? "";
      await deleteDiscountCode(id, false, token);
      void fetchDiscounts();
      setSnackbar({ open: true, message: "Discount deleted", severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : "Failed to delete discount",
        severity: "error",
      });
    }
  };

  const handleDeactivate = async (discount: DiscountCodeResponse) => {
    if (!window.confirm(t("deactivateConfirmMessage"))) return;
    try {
      const token = session?.accessToken ?? "";
      await updateDiscountCode(discount.discountId, { isActive: false }, token);
      void fetchDiscounts();
      setSnackbar({ open: true, message: "Discount deactivated", severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : "Failed to deactivate discount",
        severity: "error",
      });
    }
  };

  const filtersActive = Boolean(debouncedSearch || statusFilter);
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const getStatusChip = (discount: DiscountCodeResponse) => {
    const status = getDiscountStatus(discount);
    if (status === "active") {
      return (
        <Chip
          label={t("statusActive")}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.status.active.main, 0.15),
            color: "status.active.main",
            fontWeight: 700,
          }}
        />
      );
    }
    if (status === "expired") {
      return (
        <Chip
          label={t("statusExpired")}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.text.disabled, 0.15),
            color: "text.secondary",
            fontWeight: 700,
          }}
        />
      );
    }
    return (
      <Chip
        label={t("statusInactive")}
        size="small"
        sx={{
          bgcolor: alpha(theme.palette.error.main, 0.15),
          color: "error.main",
          fontWeight: 700,
        }}
      />
    );
  };

  const resolvePaletteColor = useMemo(
    () => (color: string) => {
      const isPaletteColor = color in theme.palette;
      return isPaletteColor ? (theme.palette[color as keyof typeof theme.palette] as { main: string }).main : color;
    },
    [theme]
  );

  const summaryCards = [
    {
      icon: <OfferIcon fontSize="small" />,
      label: "Total Discounts",
      value: discounts.length,
      color: "primary",
    },
    {
      icon: <ActiveIcon fontSize="small" />,
      label: t("statusActive"),
      value: activeCount,
      color: "success",
    },
    {
      icon: <ExpiredIcon fontSize="small" />,
      label: t("statusExpired"),
      value: expiredCount,
      color: "warning",
    },
    {
      icon: <UsageIcon fontSize="small" />,
      label: "Total Usage",
      value: totalUsage,
      color: "info",
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {t("title")}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
          width: "100%",
        }}
      >
        {summaryCards.map(card => {
          const mainColor = resolvePaletteColor(card.color);
          return (
            <Card
              key={card.label}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                position: "relative",
                overflow: "hidden",
                height: "100%",
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mainColor, 0.08)} 100%)`,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(mainColor, 0.18)}`,
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -18,
                  right: -18,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: alpha(mainColor, 0.1),
                }}
              />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, width: 40, height: 40 }}>
                  {card.icon}
                </Avatar>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                    noWrap
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: mainColor,
                      lineHeight: 1.1,
                      fontSize: { xs: "1.6rem", sm: "2.125rem" },
                    }}
                    noWrap
                  >
                    {loading ? "..." : card.value}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Box>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ mb: 3, width: "100%", justifyContent: "space-between", alignItems: { xs: "stretch", lg: "center" } }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexGrow: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search discounts..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: "100%", sm: 240 } }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: "100%", sm: 150 } }}
          >
            <MenuItem value="">{t("filterAll")}</MenuItem>
            <MenuItem value="active">{t("filterActive")}</MenuItem>
            <MenuItem value="expired">{t("filterExpired")}</MenuItem>
          </TextField>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            router.push("/admin/promotions/create");
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, flexShrink: 0 }}
        >
          {t("createBtn")}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {loading && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              zIndex: 2,
            }}
          />
        )}
        {error && discounts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="error">{error}</Alert>
            <Button
              onClick={() => {
                void fetchDiscounts();
              }}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: () => alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell>{t("codeColumn")}</TableCell>
                  <TableCell>{t("typeColumn")}</TableCell>
                  <TableCell>{t("valueColumn")}</TableCell>
                  <TableCell>{t("statusColumn")}</TableCell>
                  <TableCell>{t("usageColumn")}</TableCell>
                  <TableCell>{t("datesColumn")}</TableCell>
                  <TableCell align="right">{t("actionsColumn")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDiscounts.length > 0 ? (
                  filteredDiscounts.map(d => {
                    const usageDisplay =
                      d.usageLimitTotal != null
                        ? `${d.currentUsageCount}/${d.usageLimitTotal}`
                        : `${d.currentUsageCount}/\u221E`;
                    const valueDisplay =
                      d.discountType === "percentage" ? `${d.discountValue}%` : `$${d.discountValue}`;
                    return (
                      <TableRow
                        key={d.discountId}
                        hover
                        onClick={() => {
                          router.push(`/admin/promotions/${d.discountId}`);
                        }}
                        sx={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.5 }} noWrap>
                            {d.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={d.discountType === "percentage" ? t("formTypePercentage") : t("formTypeFixed")}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {valueDisplay}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(d)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {usageDisplay}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {formatUtcDate(d.validFrom, locale)} - {formatUtcDate(d.validTo, locale)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/admin/promotions/${d.discountId}`);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/admin/promotions/${d.discountId}`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("analyticsBtn")}>
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/admin/promotions/${d.discountId}`);
                                }}
                              >
                                <AnalyticsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {getDiscountStatus(d) === "active" ? (
                              <Tooltip title={t("deactivateBtn")}>
                                <IconButton
                                  size="small"
                                  onClick={e => {
                                    e.stopPropagation();
                                    void handleDeactivate(d);
                                  }}
                                  sx={{ color: "warning.main" }}
                                >
                                  <InactiveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={t("deleteBtn")}>
                                <IconButton
                                  size="small"
                                  onClick={e => {
                                    e.stopPropagation();
                                    void handleDelete(d.discountId);
                                  }}
                                  sx={{ color: "error.main" }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 0 }}>
                      <EmptyState filtersActive={filtersActive} handleClearFilters={handleClearFilters} t={t} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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
            Showing {filteredDiscounts.length} of {totalCount}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => {
              setPage(val);
            }}
            size="small"
            sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
          />
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
