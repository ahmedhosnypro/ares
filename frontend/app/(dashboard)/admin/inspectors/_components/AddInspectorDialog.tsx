/* eslint-disable sonarjs/slow-regex */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { createInspector, type CreateInspectorPayload } from "@/api-clients/inspectors/inspectors";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

const initial: CreateInspectorPayload = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  employeeCode: "",
  isAvailable: true,
};

/**
 * Admin modal to provision a brand-new inspector. Backend creates the
 * underlying ApplicationUser, assigns the "Inspector" role, and the
 * Inspector profile in one call.
 */
export default function AddInspectorDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateInspectorPayload>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof CreateInspectorPayload>(key: K, value: CreateInspectorPayload[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Invalid email";
    if (!form.password || form.password.length < 6) next.password = "Password must be at least 6 characters";
    if (!form.employeeCode.trim()) next.employeeCode = "Employee code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    void (async () => {
      setServerError(null);
      if (!validate()) return;
      setSaving(true);
      try {
        await createInspector({
          ...form,
          phoneNumber: form.phoneNumber?.trim() || null,
        });
        setForm(initial);
        onCreated();
        onClose();
      } catch (err) {
        logger.error("Create inspector failed", err);
        if (err instanceof ApiError) {
          setServerError(err.body || err.message);
        } else if (err instanceof Error) {
          setServerError(err.message);
        } else {
          setServerError("Failed to create inspector. Please try again.");
        }
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleClose = () => {
    if (saving) return;
    setForm(initial);
    setErrors({});
    setServerError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Add New Inspector
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Provision an inspector account that can perform vehicle inspections.
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First Name"
              fullWidth
              value={form.firstName}
              onChange={e => {
                update("firstName", e.target.value);
              }}
              error={!!errors.firstName}
              helperText={errors.firstName}
              disabled={saving}
            />
            <TextField
              label="Last Name"
              fullWidth
              value={form.lastName}
              onChange={e => {
                update("lastName", e.target.value);
              }}
              error={!!errors.lastName}
              helperText={errors.lastName}
              disabled={saving}
            />
          </Stack>

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={form.email}
            onChange={e => {
              update("email", e.target.value);
            }}
            error={!!errors.email}
            helperText={errors.email}
            disabled={saving}
          />

          <TextField
            label="Phone Number"
            fullWidth
            value={form.phoneNumber ?? ""}
            onChange={e => {
              update("phoneNumber", e.target.value);
            }}
            disabled={saving}
            placeholder="+201000000000"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              onChange={e => {
                update("password", e.target.value);
              }}
              error={!!errors.password}
              helperText={errors.password}
              disabled={saving}
            />
            <TextField
              label="Employee Code"
              fullWidth
              value={form.employeeCode}
              onChange={e => {
                update("employeeCode", e.target.value);
              }}
              error={!!errors.employeeCode}
              helperText={errors.employeeCode}
              disabled={saving}
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={form.isAvailable}
                onChange={e => {
                  update("isAvailable", e.target.checked);
                }}
                disabled={saving}
              />
            }
            label={form.isAvailable ? "Available for assignment" : "Currently unavailable"}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? "Creating..." : "Create Inspector"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
