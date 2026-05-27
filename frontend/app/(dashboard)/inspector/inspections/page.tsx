"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Stack, Paper, Button, Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { listMyInspections, type InspectionSummary } from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../_components/InspectionStatusBadge";

export default function AssignedInspectionsPage() {
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMyInspections(false);
      setItems(data);
    } catch (err) {
      logger.error("Failed to load inspections", err);
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
          Assigned Inspections
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Inspections that need your attention.
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(n => (
            <Grid key={n} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
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
          <AssignmentIcon sx={{ fontSize: 60, mb: 1, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No assigned inspections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You&apos;re all caught up. New tasks will appear here when assigned by an admin.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {items.map(i => (
            <Grid key={i.inspectionId} size={{ xs: 12, sm: 6, md: 4 }}>
              <InspectionCard item={i} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function InspectionCard({ item }: { readonly item: InspectionSummary }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {item.bookingNumber || `Booking ${item.bookingId.split("-")[0]}`}
        </Typography>
        <InspectionStatusBadge status={item.status} />
      </Stack>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {item.vehicleDisplayName || "Vehicle"}
      </Typography>

      <Stack spacing={0.25} sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Assigned: {new Date(item.inspectionDate).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Images: {item.imageCount}
        </Typography>
        {item.submittedAt && (
          <Typography variant="caption" color="text.secondary">
            Submitted: {new Date(item.submittedAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: "auto" }}>
        <Button
          component={Link}
          href={`/inspector/inspections/${item.inspectionId}`}
          fullWidth
          variant="contained"
          startIcon={<AssignmentTurnedInIcon />}
          sx={{ borderRadius: 2 }}
        >
          Open Inspection
        </Button>
      </Box>
    </Paper>
  );
}
