"use client";

import { useState, useMemo } from "react";
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
import { z } from "zod";
import { useTranslations } from "next-intl";

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

// createInspectorSchema will be defined dynamically inside the component to support localized error messages.

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
  const t = useTranslations("dashboardAdmin.inspectors");

  const createInspectorSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, t("validation.firstNameRequired")),
        lastName: z.string().min(1, t("validation.lastNameRequired")),
        email: z
          .string()
          .min(1, t("validation.emailRequired"))
          .refine(
            val => {
              const parts = val.split("@");
              if (parts.length !== 2) return false;
              const [local, domain] = parts;
              return local.length > 0 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
            },
            { message: t("validation.emailInvalid") }
          )
          .max(256, t("validation.emailTooLong")),
        password: z
          .string()
          .min(8, t("validation.passwordTooShort"))
          .regex(/[A-Z]/, t("validation.passwordUppercase"))
          .regex(/[a-z]/, t("validation.passwordLowercase"))
          .regex(/\d/, t("validation.passwordDigit"))
          .regex(/[\W_]/, t("validation.passwordSpecial")),
        phoneNumber: z.string().optional().or(z.literal("")),
        employeeCode: z.string().min(1, t("validation.employeeCodeRequired")),
        isAvailable: z.boolean(),
      }),
    [t]
  );

  const [form, setForm] = useState<CreateInspectorPayload>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof CreateInspectorPayload>(key: K, value: CreateInspectorPayload[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const entries = Object.entries(prev).filter(([k]) => k !== key);
        return Object.fromEntries(entries);
      });
    }
  };

  const validate = (): boolean => {
    const result = createInspectorSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }

    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0] as string;
      if (!next[path]) {
        next[path] = issue.message;
      }
    }
    setErrors(next);
    return false;
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
          setServerError(t("alerts.createGenericError"));
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
            {t("dialog.title")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("dialog.subtitle")}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={t("dialog.firstName")}
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
              label={t("dialog.lastName")}
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
            label={t("dialog.email")}
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
            label={t("dialog.phoneNumber")}
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
              label={t("dialog.password")}
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
              label={t("dialog.employeeCode")}
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
            label={form.isAvailable ? t("dialog.availableForAssignment") : t("dialog.currentlyUnavailable")}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          {t("dialog.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? t("dialog.creating") : t("dialog.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
