"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  MenuItem,
  Alert,
  Divider,
  useTheme,
  Avatar,
  Chip,
  alpha,
} from "@mui/material";

import { getSupplierById, updateSupplier } from "@/api-clients/suppliers/suppliers";
import { logger } from "@/utils/logger";

// ─── section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { readonly children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            boxShadow: `0 0 6px ${alpha(theme.palette.primary.main, 0.53)}`,
          }}
        />
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: theme.palette.primary.main,
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

// ─── styled text field wrapper ─────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontSize: "0.92rem",
    transition: "box-shadow 0.25s, border-color 0.2s",
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(var(--mui-palette-primary-mainChannel) / 0.12)",
    },
  },
  "& .MuiInputLabel-root": { fontWeight: 500, fontSize: "0.88rem" },
};

// ─── main page ─────────────────────────────────────────────────────────────────
export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";

  const idFromParams = Array.isArray(params.supplierId) ? params.supplierId[0] : params.supplierId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    status: "active",
    companyName: "",
    commercialRegistrationNumber: "",
    taxId: "",
  });

  const fetchSupplier = useCallback(async () => {
    if (!idFromParams) return;
    try {
      setLoading(true);
      setError("");
      const data = await getSupplierById(idFromParams);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        status: data.status || "active",
        companyName: data.companyProfile?.companyName || "",
        commercialRegistrationNumber: data.companyProfile?.commercialRegistrationNumber || "",
        taxId: data.companyProfile?.taxId || "",
      });
    } catch (err: unknown) {
      logger.error("Fetch error:", err);
      setError("Failed to load supplier data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [idFromParams]);

  useEffect(() => {
    void fetchSupplier();
  }, [fetchSupplier]);

  const handleSubmit = async () => {
    if (!idFromParams) return;
    try {
      setSaving(true);
      setError("");
      await updateSupplier(idFromParams, form);
      router.push(`/admin/suppliers`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── loading / invalid states ──────────────────────────────────────────────
  if (loading && idFromParams) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2.5,
          mt: 14,
        }}
      >
        {/* Animated ring */}
        <Box sx={{ position: "relative", width: 52, height: 52 }}>
          <CircularProgress
            size={52}
            thickness={2.5}
            sx={{ color: alpha(theme.palette.primary.main, 0.2), position: "absolute" }}
            variant="determinate"
            value={100}
          />
          <CircularProgress
            size={52}
            thickness={2.5}
            sx={{ color: theme.palette.primary.main, position: "absolute" }}
          />
        </Box>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", letterSpacing: "0.02em" }}>
          Loading supplier data…
        </Typography>
      </Box>
    );
  }

  if (!idFromParams && !loading) {
    return <Alert severity="warning">Invalid Supplier Link</Alert>;
  }

  // Determine status metadata based on form status
  let statusMeta: { label: string; color: string; bg: string };

  if (form.status === "blocked") {
    statusMeta = {
      label: "Blocked",
      color: theme.palette.status.blocked.main,
      bg: theme.palette.status.blocked.light,
    };
  } else {
    statusMeta = {
      label: "Active",
      color: theme.palette.status.active.main,
      bg: theme.palette.status.active.light,
    };
  }

  const initials = form.companyName.trim() ? form.companyName.trim().slice(0, 2).toUpperCase() : "S";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 880,
        mx: "auto",
      }}
    >
      {/* ── page heading ── */}
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 4 }}>
        <Box>
          {/* breadcrumb-style label */}
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "text.disabled",
              mb: 0.5,
            }}
          >
            Suppliers &nbsp;/&nbsp; Edit
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {/* accent bar */}
            <Box
              sx={{
                width: 5,
                height: 30,
                borderRadius: 99,
                background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.27)})`,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.3rem", sm: "1.55rem" },
              }}
            >
              Edit Supplier
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2.5,
            fontWeight: 500,
            border: "1px solid",
            borderColor: "error.light",
          }}
        >
          {error}
        </Alert>
      )}

      {/* ── identity / status card ── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.04)} 0%, ${alpha(theme.palette.common.white, 0.01)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.common.white, 0)} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          position: "relative",
          overflow: "hidden",
          /* subtle corner glow */
          "&::before": {
            content: '""',
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: alpha(theme.palette.primary.main, 0.08),
            filter: "blur(40px)",
            pointerEvents: "none",
          },
        }}
      >
        <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
          <Avatar
            sx={{
              width: 54,
              height: 54,
              fontWeight: 800,
              fontSize: "1.05rem",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.27)}`,
              letterSpacing: "0.04em",
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.05rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {form.companyName || "—"}
            </Typography>
            <Chip
              label={statusMeta.label}
              size="small"
              sx={{
                mt: 0.75,
                height: 20,
                fontSize: "0.66rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: statusMeta.color,
                bgcolor: statusMeta.bg,
                border: "none",
                borderRadius: 1,
              }}
            />
          </Box>
        </Stack>

        <TextField
          select
          size="small"
          label="Status"
          value={form.status}
          onChange={e => {
            setForm({ ...form, status: e.target.value });
          }}
          sx={{ width: 164, ...fieldSx }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
      </Paper>

      {/* ── main form card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          /* subtle top accent line */
          "&::before": {
            content: '""',
            display: "block",
            height: 3,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
          },
        }}
      >
        {/* Business section */}
        <Box sx={{ p: { xs: 3, sm: 4 }, pb: { xs: 2.5, sm: 3.5 } }}>
          <SectionLabel>Business Information</SectionLabel>

          <Stack spacing={2.5} sx={{ mt: 2.5 }}>
            <TextField
              label="Company Name"
              fullWidth
              value={form.companyName}
              onChange={e => {
                setForm({ ...form, companyName: e.target.value });
              }}
              sx={fieldSx}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Commercial Registration"
                fullWidth
                value={form.commercialRegistrationNumber}
                onChange={e => {
                  setForm({ ...form, commercialRegistrationNumber: e.target.value });
                }}
                sx={fieldSx}
              />
              <TextField
                label="Tax ID"
                fullWidth
                value={form.taxId}
                onChange={e => {
                  setForm({ ...form, taxId: e.target.value });
                }}
                sx={fieldSx}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider
          sx={{
            borderColor: "divider",
            mx: { xs: 3, sm: 4 },
            borderStyle: "dashed",
          }}
        />

        {/* Contact section */}
        <Box sx={{ p: { xs: 3, sm: 4 }, pt: { xs: 2.5, sm: 3.5 } }}>
          <SectionLabel>Contact Details</SectionLabel>

          <Stack spacing={2.5} sx={{ mt: 2.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="First Name"
                fullWidth
                value={form.firstName}
                onChange={e => {
                  setForm({ ...form, firstName: e.target.value });
                }}
                sx={fieldSx}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={form.lastName}
                onChange={e => {
                  setForm({ ...form, lastName: e.target.value });
                }}
                sx={fieldSx}
              />
            </Stack>
            <TextField
              label="Phone Number"
              fullWidth
              value={form.phoneNumber}
              onChange={e => {
                setForm({ ...form, phoneNumber: e.target.value });
              }}
              sx={fieldSx}
            />
          </Stack>
        </Box>

        {/* Footer / actions */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
            background: "action.hover",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              router.back();
            }}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.875rem",
              letterSpacing: "0.01em",
              borderWidth: 1.5,
              transition: "background 0.2s, transform 0.15s",
              "&:hover": {
                borderWidth: 1.5,
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "translateY(0)" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={saving}
            disableElevation
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.875rem",
              letterSpacing: "0.02em",
              background: saving
                ? undefined
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: saving ? "none" : `0 4px 16px ${alpha(theme.palette.primary.main, 0.27)}`,
              transition: "box-shadow 0.25s, transform 0.15s, filter 0.2s",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                filter: "brightness(1.06)",
              },
              "&:active": { transform: "translateY(0)" },
              minWidth: 140,
            }}
          >
            {saving ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CircularProgress size={16} color="inherit" />
                <span>Saving…</span>
              </Stack>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
