"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Alert,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

export default function CommissionSettingsTab() {
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.settings");
  const [percentage, setPercentage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [driverPercentage, setDriverPercentage] = useState<string>("");
  const [driverLoading, setDriverLoading] = useState(true);
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [driverSuccess, setDriverSuccess] = useState<string | null>(null);

  const fetchCommission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!session?.accessToken) return;

      const res = await apiFetchJson<{ globalCommissionPercentage?: number }>("api/admin/commission/global", {
        accessToken: session.accessToken,
      });
      setPercentage(res.globalCommissionPercentage?.toString() || "0");
    } catch (err: unknown) {
      logger.error("Failed to fetch global commission:", err);
      const errMsg = err instanceof Error ? err.message : t("commission.error");
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, t]);

  const fetchDriverCommission = useCallback(async () => {
    try {
      setDriverLoading(true);
      setDriverError(null);
      if (!session?.accessToken) return;

      const res = await apiFetchJson<{ globalCommissionPercentage?: number }>("api/admin/commission/driver-global", {
        accessToken: session.accessToken,
      });
      setDriverPercentage(res.globalCommissionPercentage?.toString() || "0");
    } catch (err: unknown) {
      logger.error("Failed to fetch driver global commission:", err);
      const errMsg = err instanceof Error ? err.message : t("driverCommission.error");
      setDriverError(errMsg);
    } finally {
      setDriverLoading(false);
    }
  }, [session?.accessToken, t]);

  useEffect(() => {
    fetchCommission().catch((err: unknown) => {
      logger.error("Error in fetchCommission:", err);
    });
  }, [fetchCommission]);

  useEffect(() => {
    fetchDriverCommission().catch((err: unknown) => {
      logger.error("Error in fetchDriverCommission:", err);
    });
  }, [fetchDriverCommission]);

  const handleSave = async () => {
    try {
      if (!session?.accessToken) {
        setError(t("commission.unauthorized"));
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);
      const numValue = parseFloat(percentage);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        throw new Error("Commission percentage must be between 0 and 100");
      }

      await apiFetchJson("api/admin/commission/global", {
        method: "PUT",
        accessToken: session.accessToken,
        body: JSON.stringify({ percentage: numValue }),
      });
      setSuccess(t("commission.success"));
    } catch (err: unknown) {
      logger.error("Failed to update global commission:", err);
      const apiError = err as { message?: string; response?: { data?: { message?: string } } };
      setError(apiError.message || apiError.response?.data?.message || t("commission.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDriverSave = async () => {
    try {
      if (!session?.accessToken) {
        setDriverError(t("commission.unauthorized"));
        return;
      }

      setDriverSaving(true);
      setDriverError(null);
      setDriverSuccess(null);
      const numValue = parseFloat(driverPercentage);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        throw new Error("Commission percentage must be between 0 and 100");
      }

      await apiFetchJson("api/admin/commission/driver-global", {
        method: "PUT",
        accessToken: session.accessToken,
        body: JSON.stringify({ percentage: numValue }),
      });
      setDriverSuccess(t("driverCommission.success"));
    } catch (err: unknown) {
      logger.error("Failed to update driver global commission:", err);
      const apiError = err as { message?: string; response?: { data?: { message?: string } } };
      setDriverError(apiError.message || apiError.response?.data?.message || t("driverCommission.error"));
    } finally {
      setDriverSaving(false);
    }
  };

  if (loading && driverLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("commission.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("commission.subtitle")}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Box sx={{ maxWidth: 400 }}>
              <TextField
                label={t("commission.rateLabel")}
                fullWidth
                type="number"
                value={percentage}
                onChange={e => {
                  setPercentage(e.target.value);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { min: 0, max: 100, step: "0.1" },
                }}
              />
            </Box>

            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveRoundedIcon />}
                onClick={() => {
                  void handleSave();
                }}
                disabled={saving}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                {saving ? t("commission.updating") : t("commission.updateRates")}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {t("driverCommission.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("driverCommission.subtitle")}
              </Typography>
            </Box>

            {driverError && <Alert severity="error">{driverError}</Alert>}
            {driverSuccess && <Alert severity="success">{driverSuccess}</Alert>}

            <Box sx={{ maxWidth: 400 }}>
              <TextField
                label={t("commission.rateLabel")}
                fullWidth
                type="number"
                value={driverPercentage}
                onChange={e => {
                  setDriverPercentage(e.target.value);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { min: 0, max: 100, step: "0.1" },
                }}
              />
            </Box>

            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={driverSaving ? <CircularProgress size={20} color="inherit" /> : <SaveRoundedIcon />}
                onClick={() => {
                  void handleDriverSave();
                }}
                disabled={driverSaving}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                {driverSaving ? t("commission.updating") : t("commission.updateRates")}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
