"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Divider,
  type Theme,
  type SelectChangeEvent,
  type AlertColor,
} from "@mui/material";

import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { toggleUserStatus, deleteUser, getUsers, type User } from "@/api-clients/users/users";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import VehicleStats from "@/app/(dashboard)/_components/VehicleStats";

interface UserMobileCardProps {
  readonly u: User;
  readonly theme: Theme;
  readonly fetchUsers: () => void;
  readonly onRequestDelete: (u: User) => void;
}

function UserMobileCard({ u, theme, fetchUsers, onRequestDelete }: UserMobileCardProps) {
  const status = (u.status || "").toLowerCase();
  const isActive = status === "active";

  const handleToggleStatus = useCallback(async () => {
    try {
      await toggleUserStatus(u.id);
      fetchUsers();
    } catch (err) {
      logger.error("Failed to toggle user status", err);
    }
  }, [u.id, fetchUsers]);

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
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.light,
              fontWeight: 700,
              width: 40,
              height: 40,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {u.firstName[0]}
            {u.lastName[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
              {u.firstName} {u.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {u.email}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={status}
          size="small"
          sx={{
            ml: 1,
            flexShrink: 0,
            textTransform: "capitalize",
            bgcolor: isActive ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
            color: isActive ? theme.palette.success.main : theme.palette.error.main,
            fontWeight: 700,
            fontSize: 11,
          }}
        />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "capitalize", display: "block", mb: 1.5 }}
      >
        Role: <strong>{u.roles.join(", ") || "—"}</strong>
      </Typography>

      <Stack direction="row" spacing={1}>
        <Tooltip title="View">
          <IconButton component={Link} href={`/admin/users/${u.id}`} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit">
          <IconButton component={Link} href={`/admin/users/${u.id}/edit`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isActive ? "Block User" : "Activate User"}>
          <IconButton
            size="small"
            onClick={() => {
              void handleToggleStatus();
            }}
            sx={{ color: isActive ? "error.main" : "success.main" }}
          >
            {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete User">
          <IconButton
            size="small"
            onClick={() => {
              onRequestDelete(u);
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

export default function UsersTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });

  const PAGE_SIZE = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers(1, 100);

      const normalized: User[] = (data.data || []).map(u => ({
        ...u,
        status: (u.status || "").toLowerCase(),
        roles: Array.isArray(u.roles)
          ? u.roles.map((r: string) => r.toLowerCase())
          : [((u.roles as string) || "").toLowerCase()],
      }));

      setUsers(normalized);
    } catch (err) {
      logger.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const requestDelete = useCallback((u: User) => {
    setDeleteTarget(u);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleting(current => {
      if (!current) setDeleteTarget(null);
      return current;
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setToast({
        open: true,
        message: deleteTarget.firstName + " " + deleteTarget.lastName + " was permanently deleted.",
        severity: "success",
      });
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      logger.error("Failed to delete user", err);

      let message = "Failed to delete user. Please try again.";
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.body) as { message?: string };
          if (parsed.message) message = parsed.message;
        } catch {
          if (err.body) message = err.body;
        }
      }
      setToast({ open: true, message, severity: "error" });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      const matchRole = roleFilter === "all" || u.roles.includes(roleFilter.toLowerCase());
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

<<<<<<< HEAD:frontend/app/(dashboard)/admin/users/UsersTab.tsx
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const blockedUsers = users.filter(u => u.status === "blocked").length;
=======
  // Fallbacks are the exact values from the user's design image
  const cardItems = useMemo(
    () => [
      {
        label: "Total Users",
        value: totalStatsUsers,
        fallback: 1248,
        change: "↑ 12.5% month",
        color: "info",
        icon: <UsersIcon />,
      },
      {
        label: "Active",
        value: activeUsersCount,
        fallback: 1120,
        change: "↑ 11.2% month",
        color: "active",
        icon: <ActiveIcon />,
      },
      {
        label: "Blocked",
        value: blockedUsersCount,
        fallback: 128,
        change: "↓ 2.5% month",
        color: "blocked",
        icon: <BlockedIcon />,
      },
      {
        label: "Admins",
        value: adminsCount,
        fallback: 12,
        change: "↑ 4.2% month",
        color: "primary",
        icon: <KeyIcon />,
      },
      {
        label: "Customers",
        value: customersCount,
        fallback: 842,
        change: "↑ 10.3% month",
        color: "success",
        icon: <UserIcon />,
      },
      {
        label: "Suppliers",
        value: suppliersCount,
        fallback: 156,
        change: "↑ 8.1% month",
        color: "completed",
        icon: <StoreIcon />,
      },
      {
        label: "Drivers",
        value: driversCount,
        fallback: 192,
        change: "↑ 14.7% month",
        color: "pending",
        icon: <SteeringWheelIcon />,
      },
      {
        label: "Inspectors",
        value: inspectorsCount,
        fallback: 58,
        change: "↑ 6.2% month",
        color: "blocked",
        icon: <ShieldIcon />,
      },
    ],
    [
      totalStatsUsers,
      activeUsersCount,
      blockedUsersCount,
      adminsCount,
      customersCount,
      suppliersCount,
      driversCount,
      inspectorsCount,
    ]
  );
>>>>>>> 0fbecac (Sync with main and format):frontend/app/[locale]/(dashboard)/admin/users/UsersTab.tsx

  const userStatsItems = useMemo(
    () => [
      { label: "Total Users", value: totalUsers, color: "primary", icon: <PeopleIcon fontSize="small" /> },
      { label: "Active Users", value: activeUsers, color: "success", icon: <CheckCircleIcon fontSize="small" /> },
      { label: "Blocked Users", value: blockedUsers, color: "error", icon: <BlockIcon fontSize="small" /> },
    ],
    [totalUsers, activeUsers, blockedUsers]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (isMobile) {
      return (
        <Box>
          {pageData.length > 0 ? (
            pageData.map(u => (
              <UserMobileCard
                key={u.id}
                u={u}
                theme={theme}
                fetchUsers={() => {
                  void fetchUsers();
                }}
                onRequestDelete={requestDelete}
              />
            ))
          ) : (
            <Box sx={{ py: 8, textAlign: "center", opacity: 0.6 }}>
              <SearchIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                No users found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </Typography>
            </Box>
          )}
          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
            <Typography variant="caption">
              Showing {pageData.length} of {filtered.length}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => {
                setPage(v);
              }}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
            />
          </Stack>
        </Box>
      );
    }

    return (
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageData.length > 0 ? (
                pageData.map(u => {
                  const status = (u.status || "").toLowerCase();
                  const isActive = status === "active";

                  const handleStatusClick = async () => {
                    try {
                      await toggleUserStatus(u.id);
                      await fetchUsers();
                    } catch (err) {
                      logger.error("Failed to toggle status", err);
                    }
                  };

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.light,
                              fontWeight: 700,
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 },
                              fontSize: { xs: 13, sm: 16 },
                            }}
                          >
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: { xs: 13, sm: 15 } }}>
                              {u.firstName} {u.lastName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "block", sm: "none" } }}
                            >
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{u.email}</TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                          {u.roles.join(", ") || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            bgcolor: isActive
                              ? alpha(theme.palette.success.main, 0.15)
                              : alpha(theme.palette.error.main, 0.15),
                            color: isActive ? theme.palette.success.main : theme.palette.error.main,
                            fontWeight: 700,
                            fontSize: { xs: 11, sm: 13 },
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                          <Tooltip title="View">
                            <IconButton component={Link} href={`/admin/users/${u.id}`} size="small">
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              component={Link}
                              href={`/admin/users/${u.id}/edit`}
                              size="small"
                              sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={isActive ? "Block User" : "Activate User"}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                void handleStatusClick();
                              }}
                              sx={{ color: isActive ? "error.main" : "success.main" }}
                            >
                              {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => {
                                requestDelete(u);
                              }}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ textAlign: "center", opacity: 0.6 }}>
                      <SearchIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No users found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="caption">
                    Showing {pageData.length} of {filtered.length}
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
                    siblingCount={0}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
            Users Directory
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage platform users
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Link
            href="/admin/users/create"
            style={{
              textDecoration: "none",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 700,
                color: "common.white",
                background: (t: Theme) =>
                  `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
                boxShadow: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                transition: "0.2s",
                whiteSpace: "nowrap",
                width: { xs: "100%", sm: "auto" },
                "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
              }}
            >
              + Add New User
            </Box>
          </Link>
        </Stack>
      </Stack>

      {/* STATS */}
      <VehicleStats items={userStatsItems} />

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search..."
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

        <FormControl sx={{ minWidth: { xs: "100%", sm: 140 } }} size={isMobile ? "small" : "medium"}>
          <Select
            value={roleFilter}
            onChange={(e: SelectChangeEvent) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            displayEmpty
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="supplier">Supplier</MenuItem>
            <MenuItem value="driver">Driver</MenuItem>
            <MenuItem value="inspector">Inspector</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: { xs: "100%", sm: 140 } }} size={isMobile ? "small" : "medium"}>
          <Select
            value={statusFilter}
            onChange={(e: SelectChangeEvent) => {
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
      {renderContent()}

      {/* Delete confirmation modal */}
      <Dialog
        open={deleteTarget !== null}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-user-dialog-title"
      >
        <DialogTitle
          id="delete-user-dialog-title"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
        >
          <WarningAmberIcon color="error" />
          Delete User
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to permanently delete the following account:
          </Typography>

          {deleteTarget && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: t => alpha(t.palette.text.primary, 0.02),
              }}
            >
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
                    {deleteTarget.firstName} {deleteTarget.lastName}
                  </Typography>
                </Box>
                <Divider flexItem />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>
                    {deleteTarget.email}
                  </Typography>
                </Box>
                <Divider flexItem />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", textTransform: "capitalize" }}>
                    {deleteTarget.roles.join(", ") || "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
            This action permanently deletes the user and cannot be undone.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={deleting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              void confirmDelete();
            }}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlinedIcon />}
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
