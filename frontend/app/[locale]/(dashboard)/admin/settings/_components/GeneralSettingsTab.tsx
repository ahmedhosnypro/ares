"use client";

import { useState, useEffect, type ChangeEvent, type SyntheticEvent } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { toApiUrl } from "@/utils/api-client";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { logger } from "@/utils/logger";

interface SettingsResponse {
  language?: string;
  currency?: string;
}

export default function GeneralSettingsTab() {
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.settings");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({ language: "en", currency: "USD" });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response = await axios.get<SettingsResponse>(toApiUrl("/api/settings"));
        setFormData({
          language: response.data.language ?? "en",
          currency: response.data.currency ?? "USD",
        });
      } catch (err: unknown) {
        logger.error("Failed to load settings", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };
    void fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      setErrorMsg(t("general.unauthorized"));
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await axios.put(toApiUrl("/api/update-settings"), formData, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setSuccessMsg(t("general.success"));
    } catch (err: unknown) {
      let message = t("general.error");
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Card
        sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" }}
      >
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("general.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("general.subtitle")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t("general.languageLabel")}
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
              >
                <MenuItem value="en">English (EN)</MenuItem>
                <MenuItem value="ar">Arabic (AR)</MenuItem>
                <MenuItem value="fr">French (FR)</MenuItem>
                <MenuItem value="es">Spanish (ES)</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={t("general.currencyLabel")}
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <MenuItem value="USD">US Dollar (USD)</MenuItem>
                <MenuItem value="EUR">Euro (EUR)</MenuItem>
                <MenuItem value="EGP">Egyptian Pound (EGP)</MenuItem>
                <MenuItem value="SAR">Saudi Riyal (SAR)</MenuItem>
                <MenuItem value="AED">Emirati Dirham (AED)</MenuItem>
                <MenuItem value="GBP">British Pound (GBP)</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Stack sx={{ alignItems: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveRoundedIcon />}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  {t("general.saveSettings")}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Card>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => {
          setErrorMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="error"
          onClose={() => {
            setErrorMsg(null);
          }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => {
          setSuccessMsg(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => {
            setSuccessMsg(null);
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
