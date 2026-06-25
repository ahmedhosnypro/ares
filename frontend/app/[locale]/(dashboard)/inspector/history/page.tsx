"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import Link from "next/link";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import { getInspectionHistory, type InspectionSummary } from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../_components/InspectionStatusBadge";

export default function InspectionHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInspectionHistory();
      setItems(data);
    } catch (err) {
      logger.error("Failed to load inspection history", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const q = search.toLowerCase();
      return (
        (i.bookingNumber && i.bookingNumber.toLowerCase().includes(q)) ||
        i.bookingId.toLowerCase().includes(q) ||
        (i.vehicleDisplayName && i.vehicleDisplayName.toLowerCase().includes(q)) ||
        i.status.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Inspection History
        </Typography>
        <Typography color="text.secondary" variant="body2">
          View all your submitted inspections.
        </Typography>
      </Box>

      {items.length > 0 && (
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
          <TextField
            fullWidth
            placeholder="Search by Booking Number, Vehicle, or Status..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
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
        </Paper>
      )}

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} variant="rectangular" height={80} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
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
            No history yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted inspections will appear here.
          </Typography>
        </Paper>
      ) : filteredItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 6, borderRadius: 3, border: "1px solid", borderColor: "divider", textAlign: "center" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search query.
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Stack spacing={2}>
          {filteredItems.map(i => (
            <Paper
              key={i.inspectionId}
              elevation={0}
              sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
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
                  Photos: {i.imageCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted: {i.submittedAt ? new Date(i.submittedAt).toLocaleString() : "—"}
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
                View Report
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", elevation: 0 }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Booking</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Submitted At</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Photos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map(i => (
                <TableRow key={i.inspectionId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 800 }}>
                    {i.bookingNumber || `BKG-${i.bookingId.split("-")[0].toUpperCase()}`}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{i.vehicleDisplayName}</TableCell>
                  <TableCell color="text.secondary">
                    {i.submittedAt ? new Date(i.submittedAt).toLocaleString() : "—"}
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
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
