"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Stack, Paper, Button, Skeleton, Tabs, Tab, useTheme, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { listMyInspections, getInspectionHistory, type InspectionSummary } from "@/api-clients/inspections/inspections";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../_components/InspectionStatusBadge";

export default function AssignedInspectionsPage() {
  const [items, setItems] = useState<InspectionSummary[]>([]);
  const [history, setHistory] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignedData, historyData] = await Promise.all([
        listMyInspections(false),
        getInspectionHistory()
      ]);
      setItems(assignedData);
      setHistory(historyData);
    } catch (err) {
      logger.error("Failed to load inspections", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pendingItems = useMemo(() => items.filter(i => !i.isSubmitted), [items]);

  const displayItems = tabIndex === 0 ? pendingItems : history;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Assigned Inspections
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Manage your pending tasks and view recent history.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs 
          value={tabIndex} 
          onChange={(_, newVal: number) => { setTabIndex(newVal); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", fontSize: "1rem" },
          }}
        >
          <Tab 
            label={
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <span>Pending</span>
                <Chip label={pendingItems.length} size="small" color={tabIndex === 0 ? "primary" : "default"} sx={{ height: 20, fontWeight: 700 }} />
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <span>Completed</span>
                <Chip label={history.length} size="small" color={tabIndex === 1 ? "primary" : "default"} sx={{ height: 20, fontWeight: 700 }} />
              </Stack>
            } 
          />
        </Tabs>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(n => (
            <Grid key={n} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : displayItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
            textAlign: "center",
            bgcolor: "background.paper"
          }}
        >
          <AssignmentIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {tabIndex === 0 ? "No pending inspections" : "No completed inspections"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabIndex === 0 ? "You're all caught up. New tasks will appear here when assigned." : "You haven't completed any inspections yet."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {displayItems.map(i => (
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
  const theme = useTheme();
  const isCompleted = item.isSubmitted;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": { 
          borderColor: "primary.main", 
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4]
        },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {item.bookingNumber || `BKG-${item.bookingId.split("-")[0].toUpperCase()}`}
        </Typography>
        <InspectionStatusBadge status={item.status} />
      </Stack>

      <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}>
        {item.vehicleDisplayName || "Unknown Vehicle"}
      </Typography>

      <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">Scheduled:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(item.inspectionDate).toLocaleDateString()}</Typography>
        </Box>
        {item.submittedAt && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">Submitted:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(item.submittedAt).toLocaleDateString()}</Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">Photos Attached:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.imageCount}</Typography>
        </Box>
      </Stack>

      <Box sx={{ mt: "auto" }}>
        <Button
          component={Link}
          href={`/inspector/inspections/${item.inspectionId}`}
          fullWidth
          variant={isCompleted ? "outlined" : "contained"}
          startIcon={<AssignmentTurnedInIcon />}
          sx={{ 
            borderRadius: 2,
            py: 1.2,
            fontWeight: 700
          }}
        >
          {isCompleted ? "View Report" : "Start Inspection"}
        </Button>
      </Box>
    </Paper>
  );
}
