"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, InputAdornment, Paper, Skeleton, Stack, TextField, Typography, useTheme, alpha } from "@mui/material";
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
  const t = useTranslations("dashboard.inspectorInspections.tasksList");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [plateSearch, setPlateSearch] = useState("");

  const FILTER_TABS: readonly { label: string; value: FilterType }[] = [
    { label: t("filterAll"), value: "All" },
    { label: t("filterCheckOuts"), value: "CheckOut" },
    { label: t("filterCheckIns"), value: "CheckIn" },
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
      {/* Filter tabs */}
      <Stack direction="row" sx={{ gap: 1, mb: 2, flexWrap: "wrap" }}>
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
        sx={{ mb: 2.5 }}
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

      {/* Task list */}
      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      ) : filteredTasks.length === 0 ? (
        <EmptyState hasSearch={plateSearch.length > 0 || activeFilter !== "All"} />
      ) : (
        <Stack spacing={1.5}>
          {filteredTasks.map(task => (
            <TodayTaskCard key={task.inspectionId} task={task} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function EmptyState({ hasSearch }: { readonly hasSearch: boolean }) {
  const emptyT = useTranslations("dashboard.inspectorInspections.emptyState");
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
        {hasSearch ? emptyT("noMatchingTasks") : emptyT("allCaughtUp")}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {hasSearch ? emptyT("tryAdjusting") : emptyT("noPendingTasks")}
      </Typography>
    </Paper>
  );
}
