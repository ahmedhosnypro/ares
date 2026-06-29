"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Button,
  Pagination,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  type AlertColor,
} from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import { getUsers, deleteUser, type User, type UserStats } from "@/api-clients/users/users";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// Sub-components
import UserStatsGrid from "./_components/UserStatsGrid";
import UserFiltersBar from "./_components/UserFiltersBar";
import UserMobileCard from "./_components/UserMobileCard";
import UserTableDesktop from "./_components/UserTableDesktop";
import UserDeleteDialog from "./_components/UserDeleteDialog";

const PAGE_SIZE = 10;

export default function UsersTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboardAdmin.users");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters & pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Delete dialog ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Fetch users whenever filters or page change
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers(page, PAGE_SIZE, {
        searchTerm: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });

      const normalized: User[] = data.items.map(u => ({
        ...u,
        status: (u.status || "").toLowerCase(),
        roles: Array.isArray(u.roles)
          ? u.roles.map((r: string) => r.toLowerCase())
          : [((u.roles as string) || "").toLowerCase()],
      }));

      setUsers(normalized);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats);
    } catch (err) {
      logger.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const requestDelete = useCallback((u: User) => {
    setDeleteTarget(u);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleting(current => {
      if (!current) setDeleteTarget(null);
      return current;
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setToast({ open: true, message: t("alerts.deleteSuccess"), severity: "success" });
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
  }, [deleteTarget, fetchUsers, t]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: { xs: 2, sm: 1 },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
              {t("title")}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.25 }}>
              {t("subtitle")}
            </Typography>
          </Box>

          <Link href="/admin/users/create" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              sx={{
                whiteSpace: "nowrap",
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1 },
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
              }}
            >
              {t("createBtn")}
            </Button>
          </Link>
        </Stack>
      </Box>

      {/* Stats grid */}
      <UserStatsGrid stats={stats} />

      {/* Filters bar */}
      <UserFiltersBar
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
      />

      {/* User list — loading / mobile cards / desktop table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box>
          {users.length > 0 ? (
            users.map(u => (
              <UserMobileCard key={u.id} user={u} onRefresh={handleRefresh} onRequestDelete={requestDelete} />
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
              {t("table.showingCount", { count: users.length, total: totalCount })}
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
      ) : (
        <UserTableDesktop
          users={users}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          onRefresh={handleRefresh}
          onRequestDelete={requestDelete}
        />
      )}

      {/* Delete confirmation dialog */}
      <UserDeleteDialog
        target={deleteTarget}
        deleting={deleting}
        onClose={closeDeleteDialog}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => {
          setToast(prev => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
