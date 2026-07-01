"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SearchIcon from "@mui/icons-material/Search";
import type { InspectorTask, InspectionTaskType } from "@/api-clients/inspections/inspections";
import TodayTaskCard from "./TodayTaskCard";

type FilterType = "All" | InspectionTaskType;

interface TodaysTasksListProps {
  readonly tasks: InspectorTask[];
  readonly loading: boolean;
}

export default function TodayTasksList({ tasks, loading }: TodaysTasksListProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardInspector.inspections");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [plateSearch, setPlateSearch] = useState("");

  const FILTER_TABS: readonly { label: string; value: FilterType }[] = [
    { label: t("filters.all"), value: "All" },
    { label: t("filters.checkOuts"), value: "CheckOut" },
    { label: t("filters.checkIns"), value: "CheckIn" },
  ];

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (activeFilter !== "All") {
      result = result.filter(task => task.inspectionType === activeFilter);
    }

    const trimmedPlate = plateSearch.trim().toUpperCase();
    if (trimmedPlate) {
      result = result.filter(task => task.plateNumber.toUpperCase().includes(trimmedPlate));
    }

    return result;
  }, [tasks, activeFilter, plateSearch]);

  return (
    <Box>
      {/* Search and Filters Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 3 }}
      >
        {/* Filter tabs */}
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.value;
            return (
              <Box
                key={tab.value}
                component="button"
                onClick={() => {
                  setActiveFilter(tab.value);
                }}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: 99,
                  border: "1px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  bgcolor: isActive ? "primary.main" : "background.paper",
                  color: isActive ? "primary.contrastText" : "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isActive ? theme.palette.shadow.button : "none",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: isActive ? "primary.main" : alpha(theme.palette.primary.main, 0.06),
                    color: isActive ? "primary.contrastText" : "primary.main",
                  },
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Stack>

        {/* Plate number search */}
        <TextField
          id="plate-search"
          placeholder={t("searchPlaceholder")}
          value={plateSearch}
          onChange={e => {
            setPlateSearch(e.target.value);
          }}
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          aria-label={t("searchAriaLabel")}
        />
      </Stack>

      {/* Task list */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(n => (
            <Grid key={n} size={{ xs: 12, md: 6, lg: 4 }}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredTasks.length === 0 ? (
        <EmptyState hasSearch={plateSearch.length > 0 || activeFilter !== "All"} />
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map(task => (
            <Grid key={task.inspectionId} size={{ xs: 12, md: 6, lg: 4 }}>
              <TodayTaskCard task={task} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function EmptyState({ hasSearch }: { readonly hasSearch: boolean }) {
  const t = useTranslations("dashboardInspector.inspections");
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 8,
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <AssignmentIcon sx={{ fontSize: 56, mb: 2, color: "text.disabled" }} />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {hasSearch ? t("emptyState.noMatchingTasks") : t("emptyState.allCaughtUp")}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {hasSearch ? t("emptyState.adjustFilter") : t("emptyState.noPendingTasks")}
      </Typography>
    </Paper>
  );
}
