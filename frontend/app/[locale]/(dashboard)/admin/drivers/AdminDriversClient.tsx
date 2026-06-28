"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "@/shared/i18n/routing";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { useTranslations } from "next-intl";

interface DriverListItem {
  driverProfileId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  availability: string;
  isActive: boolean;
  averageRating: number;
  totalTrips: number;
  createdAt: string;
}

const STATUS_FILTERS = ["All", "Incomplete", "PendingVerification", "Verified", "Rejected", "Suspended"];

function statusColor(status: string): "default" | "warning" | "success" | "error" | "info" {
  switch (status) {
    case "Verified":
      return "success";
    case "PendingVerification":
      return "warning";
    case "Rejected":
    case "Suspended":
      return "error";
    case "Incomplete":
      return "info";
    default:
      return "default";
  }
}

export default function AdminDriversClient() {
  const { data: session } = useSession();
  const theme = useTheme();
  const router = useRouter();
  const token = session?.accessToken;

  const t = useTranslations("dashboardAdmin.drivers");
  const getStatusFilterLabel = (status: string) => {
    switch (status) {
      case "All":
        return t("statuses.all");
      case "Incomplete":
        return t("statuses.incomplete");
      case "PendingVerification":
        return t("statuses.pendingVerification");
      case "Verified":
        return t("statuses.verified");
      case "Rejected":
        return t("statuses.rejected");
      case "Suspended":
        return t("statuses.suspended");
      default:
        return status;
    }
  };

  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDrivers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const url =
        tab === 1
          ? "/api/admin/drivers/pending"
          : statusFilter !== "All"
            ? `/api/admin/drivers?status=${encodeURIComponent(statusFilter)}`
            : "/api/admin/drivers";
      const res = await fetch(toApiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load drivers");
      setDrivers((await res.json()) as DriverListItem[]);
    } catch (err) {
      logger.error("Error loading admin drivers", err);
      setError(t("errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [token, tab, statusFilter, t]);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  const handleToggleActive = (driver: DriverListItem) => {
    try {
      logger.info("Toggling driver active status", driver);
    } catch (err) {
      logger.error("Failed to toggle driver status", err);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      [d.firstName, d.lastName, d.email, d.phoneNumber].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const fullName = (d: { firstName?: string; lastName?: string }) =>
    [d.firstName, d.lastName].filter(Boolean).join(" ") || "—";

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {t("title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("subtitle")}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v: number) => {
            setTab(v);
          }}
          aria-label="driver tabs"
        >
          <Tab label={t("tabs.allDrivers")} />
          <Tab label={t("tabs.pendingVerification")} />
        </Tabs>
      </Box>

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
          spacing={2}
          sx={{
            p: 2,
            bgcolor: "background.paper",
            alignItems: { md: "center" },
          }}
        >
          <TextField
            size="small"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
            }}
            sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          {tab === 0 && (
            <TextField
              select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
              }}
              size="small"
              sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              {STATUS_FILTERS.map(s => (
                <MenuItem key={s} value={s}>
                  {getStatusFilterLabel(s)}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Stack direction="row" spacing={1} sx={{ ml: { md: "auto" } }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              sx={{ borderRadius: 2 }}
            >
              {t("filters.reset")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 8, textAlign: "center", borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}
        >
          <Typography variant="h6" color="text.secondary">
            {t("noDrivers")}
          </Typography>
        </Paper>
      ) : (
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
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    },
                  }}
                >
                  <TableCell sx={{ pl: 3 }}>{t("table.driver")}</TableCell>
                  <TableCell>{t("table.status")}</TableCell>
                  <TableCell>{t("table.availability")}</TableCell>
                  <TableCell>{t("table.rating")}</TableCell>
                  <TableCell>{t("table.active")}</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    {t("table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(d => (
                  <TableRow
                    key={d.driverProfileId}
                    hover
                    sx={{
                      transition: "all 0.2s ease",
                      "&:last-child td": { border: 0 },
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                    }}
                  >
                    <TableCell sx={{ pl: 3 }}>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                            fontWeight: 700,
                            width: 40,
                            height: 40,
                            fontSize: 16,
                          }}
                        >
                          {d.firstName?.[0] || ""}
                          {d.lastName?.[0] || ""}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{fullName(d)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {d.email || d.phoneNumber || "—"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusFilterLabel(d.status)}
                        color={statusColor(d.status)}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {d.availability}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Rating value={d.averageRating} readOnly size="small" precision={0.5} />
                        <Typography variant="caption" color="text.secondary">
                          ({d.totalTrips})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.isActive ? t("table.activeStatus") : t("table.disabledStatus")}
                        color={d.isActive ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title={t("table.viewLicense")}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              router.push(`/admin/driver-licenses/${d.driverProfileId}`);
                            }}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("table.verifyStatus")}>
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => {
                              router.push(`/admin/verifications?userId=${d.userId}`);
                            }}
                          >
                            <VerifiedUserOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("table.toggleStatus")}>
                          <IconButton
                            color={d.isActive ? "error" : "success"}
                            size="small"
                            onClick={() => {
                              handleToggleActive(d);
                            }}
                          >
                            {d.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
