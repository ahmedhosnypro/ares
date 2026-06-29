"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  InputAdornment,
  Pagination,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  type Theme,
} from "@mui/material";

import { Link } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { deleteSupplier } from "@/api-clients/suppliers/suppliers";
import { getSuppliers, type Supplier } from "@/api-clients/suppliers/suppliers";
import { toggleUserStatus } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";
import VehicleStats from "@/app/[locale]/(dashboard)/_components/VehicleStats";

interface SupplierMobileCardProps {
  readonly s: Supplier;
  readonly theme: Theme;
  readonly onToggleStatus: (supplier: Supplier) => void | Promise<void>;
  readonly onDeleteClick: (supplier: Supplier) => void;
}

function SupplierMobileCard({ s, theme, onToggleStatus, onDeleteClick }: SupplierMobileCardProps) {
  const t = useTranslations("dashboardAdmin.users");
  const isActive = s.status === "active";
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" sx={{ spacing: 1.5, alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" sx={{ spacing: 1.5, alignItems: "center" }}>
          <Avatar sx={{ bgcolor: theme.palette.secondary.light, fontWeight: 700, width: 40, height: 40 }}>
            {s.firstName[0]}
            {s.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {s.firstName} {s.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.phoneNumber || t("table.noPhone")}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={isActive ? t("form.active") : t("form.blocked")}
          size="small"
          sx={{
            textTransform: "capitalize",
            bgcolor: isActive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
            color: isActive ? theme.palette.success.main : theme.palette.error.main,
            fontWeight: 700,
          }}
        />
      </Stack>

      <Stack direction="row" sx={{ gap: 0.75, alignItems: "center", mb: 0.5 }}>
        <BusinessIcon fontSize="small" color="disabled" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {s.companyProfile?.companyName || "—"}
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        {s.email}
      </Typography>

      <Stack direction="row" sx={{ spacing: 1 }}>
        <Tooltip title={t("table.viewDetails")}>
          <IconButton component={Link} href={`/admin/suppliers/${s.id}`} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("table.editProfile")}>
          <IconButton component={Link} href={`/admin/suppliers/${s.id}/edit`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
          <IconButton
            size="small"
            color={isActive ? "error" : "success"}
            onClick={() => {
              void onToggleStatus(s);
            }}
          >
            {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={s.status === "deleted" ? t("table.alreadyDeleted") : t("table.delete")}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={s.status === "deleted"}
              onClick={() => {
                onDeleteClick(s);
              }}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

export default function SuppliersTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboardAdmin.users");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 10;

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers(1, 100);
      const rawData = response.data || response.resultData || [];
      const normalized: Supplier[] = rawData.map((s: Supplier) => ({
        ...s,
        status: (s.status || "").toLowerCase(),
      }));
      setSuppliers(normalized);
    } catch (err) {
      logger.error("Failed to fetch suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSuppliers();
  }, []);

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await toggleUserStatus(supplier.id);
      await fetchSuppliers();
    } catch (err) {
      logger.error("Failed to toggle supplier status", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteSupplier(deleteTarget.id);
      setSuppliers(prev => prev.filter(s => s.id !== deleteTarget.id));
    } catch (err) {
      logger.error("Failed to delete supplier", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = `${s.firstName} ${s.lastName} ${s.email} ${s.companyProfile?.companyName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === "active").length;
  const blockedSuppliers = suppliers.filter(s => s.status === "blocked").length;

  const supplierStatsItems = useMemo(
    () => [
      { label: t("stats.suppliers"), value: totalSuppliers, color: "primary", icon: <BusinessIcon fontSize="small" /> },
      { label: t("form.active"), value: activeSuppliers, color: "success", icon: <CheckCircleIcon fontSize="small" /> },
      { label: t("form.blocked"), value: blockedSuppliers, color: "error", icon: <BlockIcon fontSize="small" /> },
    ],
    [totalSuppliers, activeSuppliers, blockedSuppliers, t]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ spacing: 2, p: 2, bgcolor: "background.paper", alignItems: { md: "center" } }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
              {t("table.suppliersTitle")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {t("table.suppliersSubtitle")}
            </Typography>
          </Box>

          <Stack direction="row" sx={{ spacing: 2, ml: { md: "auto" }, width: { xs: "100%", sm: "auto" } }}>
            <Link href="/admin/suppliers/create" style={{ textDecoration: "none", width: isMobile ? "100%" : "auto" }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 700,
                  color: "common.white",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  transition: "0.2s",
                  width: { xs: "100%", sm: "auto" },
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                }}
              >
                + {t("table.addSupplierBtn")}
              </Box>
            </Link>
          </Stack>
        </Stack>
      </Paper>

      <VehicleStats items={supplierStatsItems} />

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ spacing: 2, p: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            placeholder={t("table.searchSuppliersPlaceholder")}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">{t("filters.allStatuses")}</MenuItem>
              <MenuItem value="active">{t("form.active")}</MenuItem>
              <MenuItem value="blocked">{t("form.blocked")}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && isMobile && (
        <Box>
          {pageData.length > 0 ? (
            pageData.map(s => (
              <SupplierMobileCard
                key={s.id}
                s={s}
                theme={theme}
                onToggleStatus={handleToggleStatus}
                onDeleteClick={supplier => {
                  setDeleteTarget(supplier);
                }}
              />
            ))
          ) : (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">{t("table.noSuppliers")}</Typography>
            </Box>
          )}
          <Stack direction="column" sx={{ spacing: 1, alignItems: "center", mt: 2, mb: 1 }}>
            <Typography variant="caption">
              {t("table.showingSuppliersCount", { count: pageData.length, total: filtered.length })}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => {
                setPage(v);
              }}
              size="small"
              color="primary"
              siblingCount={0}
              boundaryCount={1}
            />
          </Stack>
        </Box>
      )}

      {!loading && !isMobile && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <TableContainer sx={{ overflowX: "auto", maxHeight: 600 }}>
            <Table stickyHeader sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-head": {
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "text.secondary",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 2,
                      bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.03),
                    },
                  }}
                >
                  <TableCell sx={{ pl: 3 }}>{t("table.supplierName")}</TableCell>
                  <TableCell>{t("table.company")}</TableCell>
                  <TableCell>{t("table.status")}</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    {t("table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pageData.length > 0 ? (
                  // eslint-disable-next-line sonarjs/cognitive-complexity
                  pageData.map(s => {
                    const isActive = s.status === "active";
                    return (
                      <TableRow
                        key={s.id}
                        hover
                        sx={{
                          transition: "all 0.2s ease",
                          "&:last-child td": { border: 0 },
                          "&:hover": { bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.03) },
                        }}
                      >
                        <TableCell sx={{ pl: 3 }}>
                          <Stack direction="row" sx={{ spacing: 2, alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: (t: Theme) => alpha(t.palette.primary.main, 0.08),
                                color: "primary.main",
                                fontWeight: 700,
                                width: 40,
                                height: 40,
                                fontSize: 16,
                              }}
                            >
                              {s.firstName[0]}
                              {s.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                                {s.firstName} {s.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {s.phoneNumber || t("table.noPhone")}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                            <BusinessIcon fontSize="small" color="disabled" />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {s.companyProfile?.companyName || "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {s.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={isActive ? t("form.active") : t("form.blocked")}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              borderRadius: 1.5,
                              bgcolor: isActive
                                ? (t: Theme) => alpha(t.palette.success.main, 0.15)
                                : (t: Theme) => alpha(t.palette.error.main, 0.15),
                              color: isActive ? "success.main" : "error.main",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Stack direction="row" sx={{ spacing: 0.5, justifyContent: "flex-end" }}>
                            <Tooltip title={t("table.viewDetails")}>
                              <IconButton
                                component={Link}
                                href={`/admin/suppliers/${s.id}`}
                                size="small"
                                sx={{ color: "text.secondary" }}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("table.editProfile")}>
                              <IconButton
                                component={Link}
                                href={`/admin/suppliers/${s.id}/edit`}
                                size="small"
                                sx={{ color: "text.secondary" }}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
                              <IconButton
                                size="small"
                                color={isActive ? "error" : "success"}
                                onClick={() => {
                                  void handleToggleStatus(s);
                                }}
                              >
                                {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={s.status === "deleted" ? t("table.alreadyDeleted") : t("table.delete")}>
                              <span>
                                <IconButton
                                  size="small"
                                  sx={{ color: "error.main" }}
                                  disabled={s.status === "deleted"}
                                  onClick={() => {
                                    setDeleteTarget(s);
                                  }}
                                >
                                  <DeleteOutlinedIcon fontSize="small" />
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
                    <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">{t("table.noSuppliers")}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} sx={{ pl: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("table.showingSuppliersCount", { count: pageData.length, total: filtered.length })}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2} align="right" sx={{ pr: 3 }}>
                    {totalPages > 1 && (
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, v) => {
                          setPage(v);
                        }}
                        size="small"
                        sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("dialogs.deleteSupplierTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("dialogs.deleteSupplierConfirm", {
              name: `${deleteTarget?.firstName} ${deleteTarget?.lastName}`,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteTarget(null);
            }}
            disabled={deleting}
            variant="outlined"
          >
            {t("details.cancel")}
          </Button>
          <Button
            onClick={() => {
              void handleDeleteConfirm();
            }}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />}
          >
            {deleting ? t("dialogs.deleting") : t("table.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
