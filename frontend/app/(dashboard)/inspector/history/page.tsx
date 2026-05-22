/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "@mui/material";
import Link from "next/link";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  getInspectionHistory,
  type InspectionSummary,
} from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../_components/InspectionStatusBadge";

export default function InspectionHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Inspection History
        </Typography>
        <Typography color="text.secondary" variant="body2">
          All inspections you&apos;ve submitted.
        </Typography>
      </Box>

      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map(n => (
            <Skeleton key={n} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <HistoryIcon sx={{ fontSize: 60, mb: 1, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No history yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted inspections will appear here.
          </Typography>
        </Paper>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {items.map(i => (
            <Paper
              key={i.inspectionId}
              elevation={0}
              sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {i.bookingNumber || i.bookingId.split("-")[0]}
                </Typography>
                <InspectionStatusBadge status={i.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {i.vehicleDisplayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Submitted: {i.submittedAt ? new Date(i.submittedAt).toLocaleString() : "—"}
              </Typography>
              <Button
                component={Link}
                href={`/inspector/inspections/${i.inspectionId}`}
                size="small"
                startIcon={<VisibilityOutlinedIcon />}
                sx={{ mt: 1 }}
              >
                View
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Images</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.inspectionId} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{i.bookingNumber || i.bookingId.split("-")[0]}</TableCell>
                  <TableCell>{i.vehicleDisplayName}</TableCell>
                  <TableCell>{i.submittedAt ? new Date(i.submittedAt).toLocaleString() : "—"}</TableCell>
                  <TableCell>{i.imageCount}</TableCell>
                  <TableCell>
                    <InspectionStatusBadge status={i.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={Link}
                      href={`/inspector/inspections/${i.inspectionId}`}
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                    >
                      View
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
