"use client";

import { useEffect, useState, type JSX } from "react";
import {
  Paper,
  Typography,
  Stack,
  Box,
  Chip,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  alpha,
  type Theme,
  type SelectChangeEvent,
} from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import { listInspectors, type Inspector } from "@/api-clients/inspectors/inspectors";
import { assignInspectorToBooking, type InspectionDetails } from "@/api-clients/inspections/inspections";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface Props {
  readonly bookingId: string;
  /** Optional pre-loaded inspection status info from the booking */
  readonly initialInspectorId?: string | null;
  readonly initialInspectionStatus?: string | null;
  readonly onAssignSuccess?: (inspection: InspectionDetails) => void;
}

function statusChipProps(status: string | null | undefined, theme: Theme): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    Pending: { bg: alpha(theme.palette.warning.main, 0.15), color: theme.palette.warning.main },
    Approved: { bg: alpha(theme.palette.success.main, 0.15), color: theme.palette.success.main },
    Rejected: { bg: alpha(theme.palette.error.main, 0.15), color: theme.palette.error.main },
    NotRequired: { bg: alpha(theme.palette.grey[500], 0.15), color: theme.palette.text.secondary },
  };
  const key = status || "NotRequired";
  return map[key] ?? map.NotRequired;
}

/**
 * Drop-in panel for the admin booking-details page. Renders the current
 * inspection status, lets the admin pick an inspector and assign, and shows
 * the resulting assignment once made.
 */
export default function BookingInspectionPanel({
  bookingId,
  initialInspectorId,
  initialInspectionStatus,
  onAssignSuccess,
}: Props): JSX.Element {
  const theme = useTheme();

  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loadingInspectors, setLoadingInspectors] = useState(true);
  const [selectedInspectorUserId, setSelectedInspectorUserId] = useState<string>(initialInspectorId ?? "");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inspection, setInspection] = useState<InspectionDetails | null>(null);

  // Initial label for the badge — kept in sync with the assignment.
  const inspectionStatus =
    inspection?.status ??
    (initialInspectionStatus && initialInspectionStatus !== "NotRequired" ? initialInspectionStatus : null);

  useEffect(() => {
    setSelectedInspectorUserId(initialInspectorId ?? "");
  }, [initialInspectorId]);

  useEffect(() => {
    const loadInspectors = async (): Promise<void> => {
      try {
        setLoadingInspectors(true);
        const data = await listInspectors(true);
        setInspectors(data);
      } catch (err) {
        logger.error("Failed to load inspectors", err);
      } finally {
        setLoadingInspectors(false);
      }
    };
    void loadInspectors();
  }, []);

  const assigned = inspectors.find(i => i.userId === selectedInspectorUserId);

  const handleAssign = (): void => {
    void (async (): Promise<void> => {
      if (!selectedInspectorUserId) {
        setError("Please select an inspector first.");
        return;
      }
      setError(null);
      setSuccessMsg(null);
      setAssigning(true);
      try {
        const result = await assignInspectorToBooking(bookingId, {
          inspectorUserId: selectedInspectorUserId,
        });
        setInspection(result);
        setSuccessMsg("Inspector assigned successfully. The inspector has been notified.");
        if (onAssignSuccess) {
          onAssignSuccess(result);
        }
      } catch (err) {
        logger.error("Assign inspector failed", err);
        if (err instanceof ApiError) {
          setError(err.body || err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to assign inspector. Please try again.");
        }
      } finally {
        setAssigning(false);
      }
    })();
  };

  const chip = statusChipProps(inspectionStatus, theme);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <AssignmentIndIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Vehicle Inspection
        </Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Status row */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Inspection Status
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={inspectionStatus ?? "Not Assigned"}
              size="small"
              sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700 }}
            />
          </Box>
        </Box>

        {assigned && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Assigned Inspector
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 0.5 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 32, height: 32, fontSize: 14 }}>
                {assigned.firstName[0]}
                {assigned.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {assigned.firstName} {assigned.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {assigned.employeeCode}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      {inspection?.isSubmitted ? (
        <Alert severity="info">Inspection has been submitted and is locked. Cannot reassign at this stage.</Alert>
      ) : (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Select Inspector
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedInspectorUserId}
                displayEmpty
                disabled={loadingInspectors || assigning}
                onChange={(e: SelectChangeEvent) => {
                  setSelectedInspectorUserId(e.target.value);
                  setError(null);
                }}
                renderValue={(selected: string): React.ReactNode => {
                  if (!selected) return <em>Choose an active inspector...</em>;
                  const ins = inspectors.find(i => i.userId === selected);
                  const label = ins ? `${ins.firstName} ${ins.lastName} (${ins.employeeCode})` : selected;
                  return <span>{label}</span>;
                }}
              >
                {inspectors.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active inspectors available
                  </MenuItem>
                ) : (
                  inspectors.map(i => (
                    <MenuItem key={i.userId} value={i.userId}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: 11,
                            bgcolor: theme.palette.primary.light,
                          }}
                        >
                          {i.firstName[0]}
                          {i.lastName[0]}
                        </Avatar>
                        <span>
                          {i.firstName} {i.lastName} — {i.employeeCode}
                        </span>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleAssign}
              disabled={!selectedInspectorUserId || assigning || loadingInspectors}
              startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <AssignmentIndIcon />}
              sx={{ minWidth: 160, whiteSpace: "nowrap" }}
            >
              {assigning ? "Assigning..." : "Assign Inspector"}
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
}
