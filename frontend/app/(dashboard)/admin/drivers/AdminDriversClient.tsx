"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";


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

  const [tab, setTab] = useState(0); // 0 = All, 1 = Pending
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
      setDrivers(await res.json());
    } catch (err) {
      logger.error("Error loading admin drivers", err);
      setError("Could not load drivers.");
    } finally {
      setIsLoading(false);
    }
  }, [token, tab, statusFilter]);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        Driver Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review driver documents, verify, approve or reject applications, and enable or disable accounts.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
          }}
          aria-label="driver tabs"
        >
          <Tab label="All Drivers" />
          <Tab label="Pending Verification" />
        </Tabs>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          label="Search by name, email or phone"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
          sx={{ minWidth: 280 }}
        />
        {tab === 0 && (
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            {STATUS_FILTERS.map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

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
            No drivers found
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Availability</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.driverProfileId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{fullName(d)}</TableCell>
                  <TableCell>{d.email || "—"}</TableCell>
                  <TableCell>
                    <Chip label={d.status} color={statusColor(d.status)} size="small" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{d.availability}</TableCell>
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
                      label={d.isActive ? "Active" : "Disabled"}
                      color={d.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => router.push(`/admin/drivers/${d.driverProfileId}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
