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
  SvgIcon,
  type Theme,
  type SelectChangeEvent,
  type AlertColor,
  type SvgIconProps,
} from "@mui/material";

import { Link } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import ShieldIcon from "@mui/icons-material/ShieldOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { toggleUserStatus, deleteUser, getUsers, type User } from "@/api-clients/users/users";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface UserMobileCardProps {
  readonly u: User;
  readonly theme: Theme;
  readonly fetchUsers: () => void;
  readonly onRequestDelete: (u: User) => void;
}

function UserMobileCard({ u, theme, fetchUsers, onRequestDelete }: UserMobileCardProps) {
  const t = useTranslations("dashboardAdmin.users");
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
            src={(u.avatarUrl as string) || undefined}
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
          label={isActive ? t("form.active") : t("form.blocked")}
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
        {t("details.role")}: <strong>{u.roles.map(r => t(`form.roles.${r.toLowerCase()}`)).join(", ") || "—"}</strong>
      </Typography>

      <Stack direction="row" spacing={1}>
        <Tooltip title={t("table.viewDetails")}>
          <IconButton component={Link} href={`/admin/users/${u.id}`} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t("table.editAccount")}>
          <IconButton component={Link} href={`/admin/users/${u.id}/edit`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
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

        <Tooltip title={t("table.delete")}>
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

function SteeringWheelIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.84.62-3.53 1.68-4.88l3.96 2.29c-.4.78-.64 1.66-.64 2.59 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.93-.24-1.81-.64-2.59l3.96-2.29C19.38 8.47 20 10.16 20 12c0 4.41-3.59 8-8 8zm0-10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6.2-4.12C7.3 4.7 9.53 4 12 4s4.7.7 5.8 1.88l-3.96 2.29C13.25 7.82 12.65 7.7 12 7.7c-.65 0-1.25.12-1.84.47L5.8 5.88z" />
    </SvgIcon>
  );
}

interface CompactStatCardProps {
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly icon: React.ReactNode;
  readonly trendText?: string;
  readonly isUp?: boolean;
}

function CompactStatCard({ label, value, color, icon, trendText, isUp = true }: CompactStatCardProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.users");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 1.25 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1.5, md: 1 }}
        sx={{ alignItems: "center", mb: { xs: 1, md: 0.5 }, minWidth: 0 }}
      >
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.12),
            color: color,
            width: { xs: 40, md: 32 },
            height: { xs: 40, md: 32 },
            flexShrink: 0,
            "& .MuiSvgIcon-root": {
              fontSize: { xs: 22, md: 18 },
            },
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ fontWeight: 700, display: "block", fontSize: { xs: 11, md: 9.5 }, lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "text.primary", mt: 0.1, fontSize: { xs: 18, md: 14 }, lineHeight: 1.1 }}
            noWrap
          >
            {value.toLocaleString()}
          </Typography>
        </Box>
      </Stack>

      {trendText && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: isUp ? theme.palette.status.active.main : theme.palette.status.blocked.main,
              fontSize: { xs: 10, md: 8.5 },
              display: "flex",
              alignItems: "center",
              gap: 0.2,
              lineHeight: 1,
            }}
          >
            {isUp ? "↑" : "↓"} {trendText}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: { xs: 9, md: 8 },
              lineHeight: 1,
              display: { xs: "inline", md: "none", lg: "inline" },
            }}
          >
            {t("stats.thisMonth")}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}

export default function UsersTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboardAdmin.users");

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
        message: t("alerts.deleteSuccess"),
        severity: "success",
      });
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      logger.error("Failed to delete user", err);

      let message = t("alerts.deleteError");
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

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const blockedUsers = users.filter(u => u.status === "blocked").length;
  const adminsCount = users.filter(u => u.roles.includes("admin")).length;
  const customersCount = users.filter(u => u.roles.includes("customer")).length;
  const suppliersCount = users.filter(u => u.roles.includes("supplier")).length;
  const driversCount = users.filter(u => u.roles.includes("driver")).length;
  const inspectorsCount = users.filter(u => u.roles.includes("inspector")).length;

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
                {t("table.noUsers")}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {t("table.noUsersDesc")}
              </Typography>
            </Box>
          )}
          <Stack direction="column" spacing={1} sx={{ alignItems: "center", mt: 2, mb: 1 }}>
            <Typography variant="caption">
              {t("table.showingCount", { count: pageData.length, total: filtered.length })}
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
                <TableCell>{t("table.user")}</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{t("table.contact")}</TableCell>
                <TableCell>{t("table.roles")}</TableCell>
                <TableCell>{t("table.status")}</TableCell>
                <TableCell align="right">{t("table.actions")}</TableCell>
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
                            src={(u.avatarUrl as string) || undefined}
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
                          {u.roles.map(r => t(`form.roles.${r.toLowerCase()}`)).join(", ") || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={isActive ? t("form.active") : t("form.blocked")}
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
                          <Tooltip title={t("table.viewDetails")}>
                            <IconButton component={Link} href={`/admin/users/${u.id}`} size="small">
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={t("table.editAccount")}>
                            <IconButton
                              component={Link}
                              href={`/admin/users/${u.id}/edit`}
                              size="small"
                              sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
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

                          <Tooltip title={t("table.delete")}>
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
                        {t("table.noUsers")}
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {t("table.noUsersDesc")}
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
                    {t("table.showingCount", { count: pageData.length, total: filtered.length })}
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
            {t("title")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("subtitle")}
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
              + {t("createBtn")}
            </Box>
          </Link>
        </Stack>
      </Stack>

      {/* STATS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
            md: "repeat(8, 1fr)",
          },
          gap: { xs: 2, md: 1 },
          mb: 4,
        }}
      >
        <CompactStatCard
          label={t("stats.totalUsers")}
          value={totalUsers}
          color={theme.palette.status.confirmed.main}
          icon={<PeopleIcon />}
          trendText="12.5%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.admins")}
          value={adminsCount}
          color={theme.palette.primary.main}
          icon={<AdminPanelSettingsIcon />}
          trendText="3.5%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.customers")}
          value={customersCount}
          color={theme.palette.status.active.main}
          icon={<PersonIcon />}
          trendText="10.3%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.suppliers")}
          value={suppliersCount}
          color={theme.palette.status.completed.main}
          icon={<StorefrontIcon />}
          trendText="8.1%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.drivers")}
          value={driversCount}
          color={theme.palette.status.pending.main}
          icon={<SteeringWheelIcon />}
          trendText="14.7%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.inspectors")}
          value={inspectorsCount}
          color={theme.palette.status.blocked.main}
          icon={<ShieldIcon />}
          trendText="6.2%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.active")}
          value={activeUsers}
          color={theme.palette.status.active.main}
          icon={<CheckCircleIcon />}
          trendText="9.4%"
          isUp={true}
        />
        <CompactStatCard
          label={t("stats.blocked")}
          value={blockedUsers}
          color={theme.palette.status.blocked.main}
          icon={<BlockIcon />}
          trendText="1.2%"
          isUp={false}
        />
      </Box>

      {/* FILTER */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t("searchPlaceholder")}
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
            <MenuItem value="all">{t("filters.allRoles")}</MenuItem>
            <MenuItem value="admin">{t("form.roles.admin")}</MenuItem>
            <MenuItem value="customer">{t("form.roles.customer")}</MenuItem>
            <MenuItem value="supplier">{t("form.roles.supplier")}</MenuItem>
            <MenuItem value="driver">{t("form.roles.driver")}</MenuItem>
            <MenuItem value="inspector">{t("form.roles.inspector")}</MenuItem>
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
            <MenuItem value="all">{t("filters.allStatuses")}</MenuItem>
            <MenuItem value="active">{t("form.active")}</MenuItem>
            <MenuItem value="blocked">{t("form.blocked")}</MenuItem>
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
          {t("dialogs.deleteTitle")}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("dialogs.deleteConfirmText")}
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
                    {t("dialogs.name")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
                    {deleteTarget.firstName} {deleteTarget.lastName}
                  </Typography>
                </Box>
                <Divider flexItem />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("dialogs.email")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>
                    {deleteTarget.email}
                  </Typography>
                </Box>
                <Divider flexItem />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("details.role")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", textTransform: "capitalize" }}>
                    {deleteTarget.roles.join(", ") || "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
            {t("dialogs.deleteWarningText")}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={deleting} color="inherit">
            {t("details.cancel")}
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
            {deleting ? t("dialogs.deleting") : t("dialogs.deleteConfirmBtn")}
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
