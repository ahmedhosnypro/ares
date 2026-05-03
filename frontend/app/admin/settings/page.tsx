"use client";

import React, { useState, useEffect } from "react";
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
import axios from "axios";
import { toApiUrl } from "@/utils/api-client";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    language: "en",
    currency: "USD",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response = await axios.get(toApiUrl("/api/settings"));
        if (isMounted) {
          if (response.data) {
            setFormData({
              language: response.data.language || "en",
              currency: response.data.currency || "USD",
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      setErrorMsg("Unauthorized. Please log in.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await axios.put(toApiUrl("/api/update-settings"), formData, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setSuccessMsg("Settings updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to update settings");
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
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" alignItems="center" mb={4} spacing={2}>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SettingsRoundedIcon fontSize="large" color="primary" />
          Platform Settings
        </Typography>
      </Stack>

      <Card
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          elevation: 0,
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Global Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Set the default language and currency for the entire platform.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Default Language"
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

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Default Currency"
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

            <Grid item xs={12} mt={2}>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveRoundedIcon />}
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  Save Settings
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Card>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
