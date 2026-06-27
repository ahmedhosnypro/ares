"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  Typography,
  Grid,
  TextField,
  Slider,
  FormControlLabel,
  Checkbox,
  Divider,
  Button,
} from "@mui/material";
import { Build as InspectionIcon, CloudUpload as UploadIcon } from "@mui/icons-material";

interface InspectionWalkthroughModalProps {
  readonly open: boolean;
  readonly type: "pre" | "post";
  readonly vehicleModel: string;
  readonly onClose: () => void;
  readonly onSubmit: (odometer: string, fuel: number, notes: string) => void;
  readonly isSubmitting: boolean;
}

export default function InspectionWalkthroughModal({
  open,
  type,
  vehicleModel,
  onClose,
  onSubmit,
  isSubmitting,
}: InspectionWalkthroughModalProps) {
  const t = useTranslations("dashboard.driverDashboard.inspectionWalkthrough");
  const tc = useTranslations("common");
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState<number>(100);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setOdometer("");
      setFuel(100);
      setNotes("");
    }
  }, [open]);

  const handleFormSubmit = () => {
    onSubmit(odometer, fuel, notes);
  };

  const rentalTypeLabel = type === "pre" ? t("preRental") : t("postRental");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: "1px solid",
            borderColor: "border.light",
            bgcolor: "background.paper",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <InspectionIcon color="primary" /> {rentalTypeLabel} {t("walkthroughInspection")}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("reviewConditionCheck")} <strong>{vehicleModel}</strong>.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t("currentOdometer")}
                  fullWidth
                  value={odometer}
                  onChange={e => {
                    setOdometer(e.target.value);
                  }}
                  placeholder={t("odometerPlaceholder")}
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("fuelLevel", { fuel })}
                </Typography>
                <Slider
                  value={fuel}
                  onChange={(_, val) => {
                    setFuel(val);
                  }}
                  step={25}
                  marks
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "block", mb: 1.5 }}
            >
              {t("exteriorVerification")}
            </Typography>
            <Stack>
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("noNewScratches")} />
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("correctTirePressure")} />
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("cleanWindshield")} />
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "block", mb: 1.5 }}
            >
              {t("interiorVerification")}
            </Typography>
            <Stack>
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("cleanCabin")} />
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("dashboardFreeOfWarnings")} />
              <FormControlLabel control={<Checkbox defaultChecked />} label={t("documentationInGloveBox")} />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "block", mb: 1.5 }}
            >
              {t("walkthroughEvidence")}
            </Typography>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: "border.light",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                bgcolor: "action.hover",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              <UploadIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {t("uploadVerificationPhotos")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("dragAndDropPhotos")}
              </Typography>
            </Box>
          </Box>

          <TextField
            label={t("walkthroughLogNotes")}
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={e => {
              setNotes(e.target.value);
            }}
            placeholder={t("logNotesPlaceholder")}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting} sx={{ textTransform: "none" }}>
          {tc("cancel")}
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !odometer}
          sx={{ textTransform: "none", minWidth: 150 }}
        >
          {isSubmitting ? t("submittingWalkthrough") : t("submitLog")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
