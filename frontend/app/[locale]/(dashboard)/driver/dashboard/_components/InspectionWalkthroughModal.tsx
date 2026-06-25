"use client";

import { useState, useEffect } from "react";
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
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState<number>(100);
  const [notes, setNotes] = useState("");

  // Reset fields when opening
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
        <InspectionIcon color="primary" /> {type === "pre" ? "Pre-Rental" : "Post-Rental"} Walkthrough Inspection
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Please review and log the current condition check of <strong>{vehicleModel}</strong>.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Current Odometer (km)"
                  fullWidth
                  value={odometer}
                  onChange={e => {
                    setOdometer(e.target.value);
                  }}
                  placeholder="e.g., 42,500"
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Fuel Level ({fuel}%)
                </Typography>
                <Slider
                  value={fuel}
                  onChange={(_, val) => {
                    setFuel(val as number);
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
              Exterior Verification
            </Typography>
            <Stack>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="No new scratches, dents, or bumper cracks"
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="All tires (including spare) have correct pressure and tread depth"
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Windshield, mirrors, and window glass are completely clean"
              />
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "block", mb: 1.5 }}
            >
              Interior Verification
            </Typography>
            <Stack>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Clean cabin, seats vacuumed, and floor mats in place"
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Dashboard is free of warnings and fault lights"
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Vehicle documentation (registration & insurance) in glove box"
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "block", mb: 1.5 }}
            >
              Walkthrough Evidence (Photos)
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
                Upload Verification Photos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drag and drop exterior photos from different angles (PNG or JPG)
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Walkthrough & Log Notes"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={e => {
              setNotes(e.target.value);
            }}
            placeholder="e.g., Vehicle runs clean, minor pre-existing scratch on rear passenger door rim logged."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !odometer}
          sx={{ textTransform: "none", minWidth: 150 }}
        >
          {isSubmitting ? "Submitting Walkthrough..." : "Submit Log"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
