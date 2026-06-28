"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AccountBalanceOutlined as BankIcon,
  SaveOutlined as SaveIcon,
  VisibilityOutlined as PreviewIcon,
  RotateLeftOutlined as ResetIcon,
  CheckCircleOutlined as CheckIcon,
} from "@mui/icons-material";
import { logger } from "@/utils/logger";

interface BankDetailsState {
  readonly bankName: string;
  readonly accountHolder: string;
  readonly iban: string;
  readonly swiftBic: string;
  readonly accountNumber: string;
  readonly routingNumber: string;
  readonly notes: string;
}

const INITIAL_BANK_DETAILS: BankDetailsState = {
  bankName: "Ares Development Bank",
  accountHolder: "ARES CAR RENTAL CO. LLC",
  iban: "AE610090000012345678901",
  swiftBic: "ARESUAEAXXX",
  accountNumber: "1234567890",
  routingNumber: "090000034",
  notes: "Please include your Booking Reference ID in the transfer payment description.",
};

export default function BankDetailsView() {
  const t = useTranslations("dashboardAdmin.bankDetails");
  const tCommon = useTranslations("common");

  const [formState, setFormState] = useState<BankDetailsState>(INITIAL_BANK_DETAILS);
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetailsState, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Feedback states
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Basic client-side validation
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BankDetailsState, string>> = {};

    if (!formState.bankName.trim()) {
      newErrors.bankName = t("validation.required");
    }
    if (!formState.accountHolder.trim()) {
      newErrors.accountHolder = t("validation.required");
    }
    if (!formState.iban.trim()) {
      newErrors.iban = t("validation.required");
    } else {
      // Basic IBAN format: 15-34 characters, start with 2 letters
      const ibanRegex = /^[A-Z]{2}[0-9A-Z]{13,32}$/i;
      if (!ibanRegex.test(formState.iban.replace(/\s+/g, ""))) {
        newErrors.iban = t("validation.invalidIban");
      }
    }
    if (!formState.swiftBic.trim()) {
      newErrors.swiftBic = t("validation.required");
    } else {
      // SWIFT/BIC: 8 or 11 characters alphanumeric
      const swiftRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/i;
      if (!swiftRegex.test(formState.swiftBic.trim())) {
        newErrors.swiftBic = t("validation.invalidSwift");
      }
    }
    if (!formState.accountNumber.trim()) {
      newErrors.accountNumber = t("validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BankDetailsState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error when editing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleReset = () => {
    setFormState(INITIAL_BANK_DETAILS);
    setErrors({});
    setSnackbarSeverity("success");
    setSnackbarMessage(t("alerts.reset"));
    logger.info("Bank details form reset to initial values.");
  };

  const handleSave = () => {
    if (!validate()) {
      setSnackbarSeverity("error");
      setSnackbarMessage(t("alerts.error"));
      logger.warn("Bank details save failed: Validation errors present.");
      return;
    }

    setIsSaving(true);
    // Simulate server request
    setTimeout(() => {
      setIsSaving(false);
      setSnackbarSeverity("success");
      setSnackbarMessage(t("alerts.success"));
      logger.info("Successfully updated platform bank account transfer details.");
    }, 2000);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
          {t("title")}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {t("subtitle")}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left column: Edit Form */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3.5 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2.5,
                    bgcolor: "rgba(15, 91, 91, 0.08)",
                    color: "primary.main",
                    display: "flex",
                  }}
                >
                  <BankIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {t("form.sectionTitle")}
                </Typography>
              </Stack>

              <TextField
                label={t("form.bankName")}
                value={formState.bankName}
                onChange={e => {
                  handleInputChange("bankName", e.target.value);
                }}
                error={!!errors.bankName}
                helperText={errors.bankName}
                disabled={isSaving}
              />

              <TextField
                label={t("form.accountHolder")}
                value={formState.accountHolder}
                onChange={e => {
                  handleInputChange("accountHolder", e.target.value);
                }}
                error={!!errors.accountHolder}
                helperText={errors.accountHolder}
                disabled={isSaving}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={t("form.accountNumber")}
                    value={formState.accountNumber}
                    onChange={e => {
                      handleInputChange("accountNumber", e.target.value);
                    }}
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber}
                    disabled={isSaving}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={t("form.routingNumber")}
                    value={formState.routingNumber}
                    onChange={e => {
                      handleInputChange("routingNumber", e.target.value);
                    }}
                    disabled={isSaving}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label={t("form.iban")}
                    value={formState.iban}
                    onChange={e => {
                      handleInputChange("iban", e.target.value);
                    }}
                    error={!!errors.iban}
                    helperText={errors.iban}
                    disabled={isSaving}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label={t("form.swiftBic")}
                    value={formState.swiftBic}
                    onChange={e => {
                      handleInputChange("swiftBic", e.target.value);
                    }}
                    error={!!errors.swiftBic}
                    helperText={errors.swiftBic}
                    disabled={isSaving}
                  />
                </Grid>
              </Grid>

              <TextField
                label={t("form.notes")}
                value={formState.notes}
                onChange={e => {
                  handleInputChange("notes", e.target.value);
                }}
                multiline
                rows={3}
                disabled={isSaving}
              />

              <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 1 }}>
                <Button variant="outlined" startIcon={<ResetIcon />} onClick={handleReset} disabled={isSaving}>
                  {t("form.reset")}
                </Button>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={isSaving}
                  sx={{ bgcolor: "primary.main" }}
                >
                  {isSaving ? t("form.saving") : t("form.saveButton")}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Customer Preview */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{ border: "1px solid", borderColor: "border.main", bgcolor: "background.paper", height: "100%" }}
          >
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", height: "100%" }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
                <Box
                  sx={{ p: 1, borderRadius: 2.5, bgcolor: "secondary.light", color: "secondary.dark", display: "flex" }}
                >
                  <PreviewIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {t("preview.title")}
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                {t("preview.description")}
              </Typography>

              {/* Simulated Customer Payment Checkout UI Block */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  border: "1px solid",
                  borderColor: "border.light",
                  bgcolor: "background.default",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {/* Simulated Payment Option Header */}
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                    {t("preview.paymentMethod")}
                  </Typography>
                  <Chip
                    size="small"
                    icon={<CheckIcon sx={{ fontSize: "14px !important", color: "status.active.contrastText" }} />}
                    label={tCommon("selected") || "Selected"}
                    sx={{ bgcolor: "status.active.light", color: "status.active.contrastText", fontWeight: 700 }}
                  />
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                  {t("preview.instruction")}
                </Typography>

                {/* Account Details Block */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    border: "1px dashed",
                    borderColor: "border.main",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {t("form.bankName")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {formState.bankName || "—"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {t("form.accountHolder")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {formState.accountHolder || "—"}
                    </Typography>
                  </Box>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        {t("form.accountNumber")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {formState.accountNumber || "—"}
                      </Typography>
                    </Grid>
                    {formState.routingNumber && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          {t("form.routingNumber")}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                          {formState.routingNumber}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {t("form.iban")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", wordBreak: "break-all" }}>
                      {formState.iban || "—"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {t("form.swiftBic")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {formState.swiftBic || "—"}
                    </Typography>
                  </Box>
                </Box>

                {formState.notes && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(184, 134, 11, 0.06)",
                      borderLeft: "4px solid",
                      borderLeftColor: "secondary.main",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "secondary.dark", fontWeight: 700, display: "block", mb: 0.5 }}
                    >
                      {t("preview.importantNotes")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.primary", fontSize: "0.825rem" }}>
                      {formState.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbarMessage !== ""}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbarMessage("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
          onClose={() => {
            setSnackbarMessage("");
          }}
          sx={{ borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
