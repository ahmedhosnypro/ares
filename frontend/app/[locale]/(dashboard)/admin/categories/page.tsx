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
  EditRounded as EditIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  Category as CategoryIcon,
  SearchRounded as SearchIcon,
  VisibilityRounded as ViewIcon,
  LocalOfferTwoTone as OfferIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  AccountBalanceWalletTwoTone as CommissionIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";
import {
  searchCategories,
  getCategorySummary,
  deleteCategory,
  AdminCategoryListDto,
  CategorySummary,
} from "@/api-clients/categories/categories";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Image from "next/image";
import { toImageUrl } from "@/utils/image-url";

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
        <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
        {filtersActive ? t("emptyState.noMatchTitle") : t("emptyState.noCategoriesTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        {filtersActive ? t("emptyState.noMatchDesc") : t("emptyState.noCategoriesDesc")}
      </Typography>
      {filtersActive && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleClearFilters}
          sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
        >
          {t("emptyState.clearFiltersBtn")}
        </Button>
      )}
    </Box>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.categories");
  const tc = useTranslations("common");

  const [categories, setCategories] = useState<AdminCategoryListDto[]>([]);
  const [summary, setSummary] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [offer, setOffer] = useState("");
  const [sortBy, setSortBy] = useState("Name A-Z");
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

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await getCategorySummary();
      setSummary(data);
    } catch {
      // Non-blocking error for stats
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await searchCategories({
        search: debouncedSearch,
        status,
        offer,
        sortBy,
        page,
        pageSize,
      });
      setCategories(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      setError(t("alerts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, debouncedSearch, status, offer, sortBy, page, pageSize]);

  useEffect(() => {
    if (session?.accessToken) {
      void fetchSummary();
      void fetchCategories();
    }
  }, [session, fetchSummary, fetchCategories]);

  const handleDelete = async (id: string, vehicleCount: number) => {
    if (vehicleCount > 0) {
      setSnackbar({ open: true, message: t("alerts.deleteHasVehiclesError"), severity: "error" });
      return;
    }

    if (!window.confirm(t("actions.deleteConfirm"))) return;

    try {
      await deleteCategory(id);
      void fetchSummary();
      void fetchCategories();
      setSnackbar({ open: true, message: t("alerts.deleteSuccess"), severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : t("alerts.deleteError"),
        severity: "error",
      });
    }
  };

  const filtersActive = Boolean(debouncedSearch || status || offer);
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setOffer("");
    setPage(1);
  };

  const getRemainingDays = (endDateString?: string) => {
    if (!endDateString) return 0;
    const end = new Date(endDateString);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const resolvePaletteColor = useMemo(
    () => (color: string) => {
      const isPaletteColor = color in theme.palette;
      return isPaletteColor ? (theme.palette[color as keyof typeof theme.palette] as { main: string }).main : color;
    },
    [theme, theme.palette]
  );

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
        {[
          {
            icon: <CategoryIcon fontSize="small" />,
            label: t("summaryCards.categories"),
            value: summary?.totalCategories ?? 0,
            color: "primary",
          },
          {
            icon: <CarIcon fontSize="small" />,
            label: t("summaryCards.vehicles"),
            value: summary?.totalVehicles ?? 0,
            color: "info",
          },
          {
            icon: <OfferIcon fontSize="small" />,
            label: t("summaryCards.withOffers"),
            value: summary?.categoriesWithOffers ?? 0,
            color: "warning",
          },
          {
            icon: <CommissionIcon fontSize="small" />,
            label: t("summaryCards.avgCommission"),
            value: summaryLoading ? "..." : `${Math.round(summary?.averageCommission ?? 0)}%`,
            color: "success",
          },
        ].map(card => {
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
                    {summaryLoading && card.label !== t("summaryCards.avgCommission") ? "..." : card.value}
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
            placeholder={t("toolbar.searchPlaceholder")}
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
            label={t("toolbar.statusLabel")}
            value={status}
            onChange={e => {
              setStatus(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: "100%", sm: 150 } }}
          >
            <MenuItem value="">{t("toolbar.allStatuses")}</MenuItem>
            <MenuItem value="Active">{t("table.statusActive")}</MenuItem>
            <MenuItem value="Inactive">{t("table.statusInactive")}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t("toolbar.offerLabel")}
            value={offer}
            onChange={e => {
              setOffer(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: "100%", sm: 150 } }}
          >
            <MenuItem value="">{t("toolbar.allOffers")}</MenuItem>
            <MenuItem value="Active Offer">{t("toolbar.activeOffer")}</MenuItem>
            <MenuItem value="Expired Offer">{t("toolbar.expiredOffer")}</MenuItem>
            <MenuItem value="No Offer">{t("toolbar.noOffer")}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t("toolbar.sortByLabel")}
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: "100%", sm: 160 } }}
          >
            <MenuItem value="Name A-Z">{t("toolbar.sortNameAZ")}</MenuItem>
            <MenuItem value="Name Z-A">{t("toolbar.sortNameZA")}</MenuItem>
            <MenuItem value="Vehicles Count">{t("toolbar.sortVehiclesCount")}</MenuItem>
            <MenuItem value="Commission">{t("toolbar.sortCommission")}</MenuItem>
            <MenuItem value="Created Date">{t("toolbar.sortCreatedDate")}</MenuItem>
          </TextField>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            router.push("/admin/categories/create");
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, flexShrink: 0 }}
        >
          {t("addCategory")}
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
        {error && categories.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="error">{error}</Alert>
            <Button
              onClick={() => {
                void fetchCategories();
              }}
              sx={{ mt: 2 }}
            >
              {tc("retry")}
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell>{t("table.headers.name")}</TableCell>
                  <TableCell>{t("table.headers.commission")}</TableCell>
                  <TableCell>{t("table.headers.vehicles")}</TableCell>
                  <TableCell>{t("table.headers.offer")}</TableCell>
                  <TableCell>{t("table.headers.status")}</TableCell>
                  <TableCell align="right">{t("table.headers.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map(c => {
                    const daysRemaining = getRemainingDays(c.offerEndDate);
                    return (
                      <TableRow
                        key={c.id}
                        hover
                        onClick={() => {
                          router.push(`/admin/vehicles?categoryId=${c.id}`);
                        }}
                        sx={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                            {c.imageUrl ? (
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1.5,
                                  overflow: "hidden",
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={toImageUrl(c.imageUrl) as string}
                                  alt={c.name}
                                  width={40}
                                  height={40}
                                  style={{ objectFit: "cover" }}
                                />
                              </Box>
                            ) : (
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: "primary.main",
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1.5,
                                  fontWeight: 700,
                                }}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </Avatar>
                            )}
                            <Box sx={{ minWidth: 0, maxWidth: 250 }}>
                              <Typography sx={{ fontWeight: 600 }} noWrap>
                                {c.name}
                              </Typography>
                              {c.description && (
                                <Tooltip title={c.description} arrow placement="bottom-start">
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {c.description}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${c.commissionPercentage}%`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, color: "text.secondary" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${c.vehicleCount} ${t("table.headers.vehicles")}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: "info.main",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {c.offerStatus === "Active" ? (
                            <Tooltip title={t("table.offerEndsIn", { days: daysRemaining })}>
                              <Chip
                                label={`${c.offerPercentage}% - ${t("table.offerEndsIn", { days: daysRemaining })}`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.15),
                                  color: "warning.main",
                                  fontWeight: 700,
                                }}
                              />
                            </Tooltip>
                          ) : c.offerStatus === "Expired" ? (
                            <Chip
                              label={t("table.expiredOffer")}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.text.disabled, 0.15),
                                color: "text.secondary",
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <Chip
                              label={t("table.offerNone")}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.text.disabled, 0.1),
                                color: "text.disabled",
                                fontWeight: 500,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.isActive ? t("table.statusActive") : t("table.statusInactive")}
                            size="small"
                            sx={{
                              bgcolor: theme =>
                                alpha(c.isActive ? theme.palette.success.main : theme.palette.text.disabled, 0.15),
                              color: c.isActive ? "success.main" : "text.secondary",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            <Tooltip title={t("actions.viewDetails")}>
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/admin/categories/${c.id}`);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("actions.edit")}>
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/admin/categories/${c.id}/edit`);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={c.vehicleCount > 0 ? t("alerts.deleteHasVehiclesError") : t("actions.delete")}
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={c.vehicleCount > 0}
                                  onClick={e => {
                                    e.stopPropagation();
                                    void handleDelete(c.id, c.vehicleCount);
                                  }}
                                  sx={{ color: "error.main", "&.Mui-disabled": { opacity: 0.3 } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 0 }}>
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
            {t("pagination.showing", { count: categories.length, total: totalCount })}
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
