"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Button,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  type SelectChangeEvent,
} from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import { type InspectionSummary } from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../_components/InspectionStatusBadge";

const MOCK_HISTORY: readonly InspectionSummary[] = [
  {
    inspectionId: "insp-001",
    bookingId: "bkg-001",
    bookingNumber: "BKG-A1B2",
    vehicleId: "veh-001",
    vehicleDisplayName: "Toyota Camry",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Approved",
    isSubmitted: true,
    inspectionDate: "2026-06-25T10:30:00Z",
    submittedAt: "2026-06-25T11:00:00Z",
    imageCount: 4,
  },
  {
    inspectionId: "insp-002",
    bookingId: "bkg-002",
    bookingNumber: "BKG-C3D4",
    vehicleId: "veh-002",
    vehicleDisplayName: "Tesla Model 3",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Rejected",
    isSubmitted: true,
    inspectionDate: "2026-06-24T14:15:00Z",
    submittedAt: "2026-06-24T15:00:00Z",
    imageCount: 6,
  },
  {
    inspectionId: "insp-003",
    bookingId: "bkg-003",
    bookingNumber: "BKG-E5F6",
    vehicleId: "veh-003",
    vehicleDisplayName: "Ford Explorer",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Pending",
    isSubmitted: false,
    inspectionDate: "2026-06-23T09:00:00Z",
    submittedAt: null,
    imageCount: 2,
  },
  {
    inspectionId: "insp-004",
    bookingId: "bkg-004",
    bookingNumber: "BKG-G7H8",
    vehicleId: "veh-004",
    vehicleDisplayName: "BMW 3 Series",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Approved",
    isSubmitted: true,
    inspectionDate: "2026-06-22T16:45:00Z",
    submittedAt: "2026-06-22T17:15:00Z",
    imageCount: 5,
  },
  {
    inspectionId: "insp-005",
    bookingId: "bkg-005",
    bookingNumber: "BKG-I9J0",
    vehicleId: "veh-005",
    vehicleDisplayName: "Hyundai Elantra",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Approved",
    isSubmitted: true,
    inspectionDate: "2026-06-21T11:20:00Z",
    submittedAt: "2026-06-21T11:50:00Z",
    imageCount: 3,
  },
  {
    inspectionId: "insp-006",
    bookingId: "bkg-006",
    bookingNumber: "BKG-K1L2",
    vehicleId: "veh-006",
    vehicleDisplayName: "Chevrolet Tahoe",
    inspectorId: "ins-001",
    inspectorFullName: "John Doe",
    status: "Pending",
    isSubmitted: false,
    inspectionDate: "2026-06-20T08:30:00Z",
    submittedAt: null,
    imageCount: 0,
  },
];

interface PaginatedHistoryResponse {
  items: InspectionSummary[];
  totalCount: number;
  page: number;
  totalPages: number;
}

async function mockFetchPaginatedData(
  page: number,
  pageSize: number,
  search: string,
  status: string
): Promise<PaginatedHistoryResponse> {
  // Simulate database/network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const q = search.toLowerCase();
  const filtered = MOCK_HISTORY.filter(i => {
    const matchesSearch =
      !q ||
      (i.bookingNumber && i.bookingNumber.toLowerCase().includes(q)) ||
      i.bookingId.toLowerCase().includes(q) ||
      (i.vehicleDisplayName && i.vehicleDisplayName.toLowerCase().includes(q)) ||
      i.status.toLowerCase().includes(q);

    const matchesStatus = status === "All" || i.status === status;

    return matchesSearch && matchesStatus;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Slice for the requested page (page is 1-indexed)
  const startIndex = (page - 1) * pageSize;
  const sliced = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items: sliced,
    totalCount,
    page,
    totalPages,
  };
}

export default function InspectionHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const t = useTranslations("dashboard.inspectorHistory");
  const tc = useTranslations("common");
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Setup debouncing for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Call local simulated paginated fetch (pageSize = 5 to demonstrate pagination)
      const res = await mockFetchPaginatedData(page, 5, debouncedSearch, statusFilter);
      setItems(res.items);
      setTotalPages(res.totalPages);
    } catch (err) {
      logger.error("Failed to load inspection history", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t("description")}
        </Typography>
      </Box>

      {(items.length > 0 || search !== "" || statusFilter !== "All") && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "stretch" }}>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                placeholder={t("search.placeholder")}
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, bgcolor: "background.default" },
                  },
                }}
              />
            </Box>
            <Box sx={{ minWidth: { xs: "100%", md: 240 } }}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label" sx={{ color: "text.secondary" }}>
                  {t("filter.statusLabel")}
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label={t("filter.statusLabel")}
                  onChange={(e: SelectChangeEvent) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  }
                  sx={{ borderRadius: 2, bgcolor: "background.default" }}
                >
                  <MenuItem value="All">{t("filter.allStatuses")}</MenuItem>
                  <MenuItem value="Approved">{t("filter.approved")}</MenuItem>
                  <MenuItem value="Rejected">{t("filter.rejected")}</MenuItem>
                  <MenuItem value="Pending">{t("filter.pending")}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} variant="rectangular" height={80} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        search !== "" || statusFilter !== "All" ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("emptySearch.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("emptySearch.description")}
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              textAlign: "center",
              bgcolor: "background.paper",
            }}
          >
            <HistoryIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t("emptyState.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("emptyState.description")}
            </Typography>
          </Paper>
        )
      ) : isMobile ? (
        <Stack spacing={2}>
          {items.map(i => (
            <Paper
              key={i.inspectionId}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1.5, alignItems: "center" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                  {i.bookingNumber || `BKG-${i.bookingId.split("-")[0].toUpperCase()}`}
                </Typography>
                <InspectionStatusBadge status={i.status} />
              </Stack>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                {i.vehicleDisplayName}
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("mobileCard.photos", { count: i.imageCount })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {i.submittedAt
                    ? t("mobileCard.submittedDate", { date: new Date(i.submittedAt).toLocaleString() })
                    : t("mobileCard.submittedFallback")}
                </Typography>
              </Stack>
              <Button
                component={Link}
                href={`/inspector/inspections/${i.inspectionId}`}
                fullWidth
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {t("mobileCard.viewReport")}
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", elevation: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("table.booking")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("table.vehicle")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("table.submittedAt")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("table.photos")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{tc("status")}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {tc("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.inspectionId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 800 }}>
                    {i.bookingNumber || `BKG-${i.bookingId.split("-")[0].toUpperCase()}`}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{i.vehicleDisplayName}</TableCell>
                  <TableCell color="text.secondary">
                    {i.submittedAt ? new Date(i.submittedAt).toLocaleString() : t("mobileCard.submittedFallback")}
                  </TableCell>
                  <TableCell>{i.imageCount}</TableCell>
                  <TableCell>
                    <InspectionStatusBadge status={i.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={Link}
                      href={`/inspector/inspections/${i.inspectionId}`}
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityOutlinedIcon />}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      {t("table.viewDetails")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {totalPages > 1 && (
        <Stack direction="row" sx={{ justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => {
              setPage(value);
            }}
            color="primary"
            variant="outlined"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
