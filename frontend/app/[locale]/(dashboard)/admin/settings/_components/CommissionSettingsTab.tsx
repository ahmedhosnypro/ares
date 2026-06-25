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
import { apiFetchJson } from "@/utils/api-client";
import { useTheme } from "@mui/material";
import { logger } from "@/utils/logger";

export default function CommissionSettingsTab() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [percentage, setPercentage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const errMsg = err instanceof Error ? err.message : "Failed to load global commission.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchCommission().catch((err: unknown) => {
      logger.error("Error in fetchCommission:", err);
    });
  }, [fetchCommission]);

  const handleSave = async () => {
    try {
      if (!session?.accessToken) return;

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
      setSuccess("Global commission percentage updated successfully.");
    } catch (err: unknown) {
      logger.error("Failed to update global commission:", err);
      const apiError = err as { message?: string; response?: { data?: { message?: string } } };
      setError(apiError.message || apiError.response?.data?.message || "Failed to update global commission.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Global Commission Rate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set the default commission percentage the platform takes from each booking. This applies to all vehicles
              unless overridden by a category-specific commission.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box sx={{ maxWidth: 400 }}>
            <TextField
              label="Commission Percentage"
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
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
