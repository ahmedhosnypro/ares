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
  Card,
  Pagination,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { Theme } from "@mui/material";

import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { deleteSupplier } from "@/api-clients/suppliers/suppliers";
import { getSuppliers, type Supplier } from "@/api-clients/suppliers/suppliers";
import { logger } from "@/utils/logger";

// ── UI Card ─────────────────────────────
interface StatCardProps {
  readonly label: string;
  readonly value: number | string;
  readonly color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        background: (t: Theme) =>
          `linear-gradient(135deg, ${t.palette.background.paper} 0%, ${alpha(color, 0.08)} 100%)`,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Card>
  );
}

// ── Mobile Card for each supplier row ───
interface SupplierMobileCardProps {
  readonly s: Supplier;
  readonly theme: Theme;
  readonly onDeleteClick: (supplier: Supplier) => void;
}

function SupplierMobileCard({ s, theme, onDeleteClick }: SupplierMobileCardProps) {
  const isActive = s.status === "active";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: theme.palette.secondary.light, fontWeight: 700, width: 40, height: 40 }}>
            {s.firstName[0]}
            {s.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {s.firstName} {s.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.phoneNumber || "No Phone"}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={s.status}
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
          {s.companyProfile?.companyName || "N/A"}
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        {s.email}
      </Typography>

      <Stack direction="row" spacing={1}>
        <Tooltip title="View Details">
          <IconButton component={Link} href={`/admin/suppliers/${s.id}`} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton component={Link} href={`/admin/suppliers/${s.id}/edit`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={isActive ? "Block" : "Activate"}>
          <IconButton size="small" color={isActive ? "error" : "success"}>
            {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={s.status === "deleted" ? "Already deleted" : "Delete"}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={s.status === "deleted"}
              onClick={() => {
                onDeleteClick(s);
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

export default function SuppliersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // ── DELETE STATE ──────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 10;

  // ── FETCH SUPPLIERS ───────────────────────
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

  // ── DELETE HANDLER ────────────────────
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

  // ── FILTER ────────────────────────────
  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = `${s.firstName} ${s.lastName} ${s.email} ${s.companyProfile?.companyName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  // ── STATS ─────────────────────────────
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === "active").length;
  const blockedSuppliers = suppliers.filter(s => s.status === "blocked").length;

  // ── PAGINATION ────────────────────────
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  logger.debug("Suppliers page data", pageData);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
            Suppliers Directory
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage your product providers and partners
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
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
              + Add New Supplier
            </Box>
          </Link>
        </Stack>
      </Stack>

      {/* STATS */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Total Suppliers" value={totalSuppliers} color={theme.palette.primary.main} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Active" value={activeSuppliers} color={theme.palette.success.main} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Blocked" value={blockedSuppliers} color={theme.palette.error.main} />
        </Grid>
      </Grid>

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email or company..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          size={isMobile ? "small" : "medium"}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl sx={{ minWidth: { xs: "100%", sm: 200 } }} size={isMobile ? "small" : "medium"}>
          <Select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            displayEmpty
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* TABLE / MOBILE CARDS */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && isMobile && (
        /* ── MOBILE: card list ── */
        <Box>
          {pageData.length > 0 ? (
            pageData.map(s => (
              <SupplierMobileCard
                key={s.id}
                s={s}
                theme={theme}
                onDeleteClick={supplier => {
                  setDeleteTarget(supplier);
                }}
              />
            ))
          ) : (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">No suppliers found</Typography>
            </Box>
          )}

          {/* PAGINATION mobile */}
          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
            <Typography variant="caption">
              Showing {pageData.length} of {filtered.length} suppliers
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
        /* ── DESKTOP: table ── */
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 550 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pageData.length > 0 ? (
                  pageData.map(s => {
                    const isActive = s.status === "active";
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                            <Avatar sx={{ bgcolor: theme.palette.secondary.light, fontWeight: 700 }}>
                              {s.firstName[0]}
                              {s.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>
                                {s.firstName} {s.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {s.phoneNumber || "No Phone"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                            <BusinessIcon fontSize="small" color="disabled" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {s.companyProfile?.companyName || "N/A"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{s.email}</TableCell>

                        <TableCell>
                          <Chip
                            label={s.status}
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              bgcolor: isActive
                                ? alpha(theme.palette.success.main, 0.1)
                                : alpha(theme.palette.error.main, 0.1),
                              color: isActive ? theme.palette.success.main : theme.palette.error.main,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            <Tooltip title="View Details">
                              <IconButton component={Link} href={`/admin/suppliers/${s.id}`} size="small">
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton component={Link} href={`/admin/suppliers/${s.id}/edit`} size="small">
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isActive ? "Block" : "Activate"}>
                              <IconButton size="small" color={isActive ? "error" : "success"}>
                                {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={s.status === "deleted" ? "Already deleted" : "Delete"}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={s.status === "deleted"}
                                  onClick={() => {
                                    setDeleteTarget(s);
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
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
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography color="text.secondary">No suppliers found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              {/* PAGINATION desktop (moved into TableFooter for semantic markup) */}
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="caption">
                      Showing {pageData.length} of {filtered.length} suppliers
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2} align="right">
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, v) => {
                        setPage(v);
                      }}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Supplier</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ? This action cannot be undone.
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
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDeleteConfirm();
            }}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
