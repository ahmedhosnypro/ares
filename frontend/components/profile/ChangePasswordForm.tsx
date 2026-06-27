"use client";

import React, { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface ChangePasswordFormProps {
  readonly userId: string;
  readonly accessToken: string;
}

type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;
type FieldErrors = Partial<Record<keyof ChangePasswordFormData, string>>;

function createChangePasswordSchema(t: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
      newPassword: z
        .string()
        .min(8, t("validation.passwordMinLength"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[a-z]/, t("validation.passwordLowercase"))
        .regex(/\d/, t("validation.passwordDigit"))
        .regex(/[\W_]/, t("validation.passwordSpecialChar")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });
}

const PASSWORD_STRENGTH_KEYS = ["tooShort", "weak", "fair", "good", "strong"] as const;

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, key: "", color: "error" as const };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  score = Math.max(score, 1);
  return {
    score,
    key: PASSWORD_STRENGTH_KEYS[score - 1] ?? "tooShort",
    color: (["error", "error", "warning", "info", "success"] as const)[score] ?? "error",
  };
}

export default function ChangePasswordForm({ userId, accessToken }: ChangePasswordFormProps) {
  const t = useTranslations("customer.changePassword");
  const localizedSchema = useMemo(() => createChangePasswordSchema(t), [t]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ChangePasswordFormData, boolean>>>({});

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword);

  const validateField = (field: keyof ChangePasswordFormData, value: string) => {
    if (field === "confirmPassword") {
      const result = localizedSchema.safeParse({ currentPassword, newPassword, confirmPassword: value });
      const issue = result.success ? undefined : result.error.issues.find(i => i.path[0] === "confirmPassword");
      setFieldErrors(prev => ({ ...prev, confirmPassword: issue?.message }));
      return;
    }
    const result = localizedSchema.shape[field].safeParse(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleBlur = (field: keyof ChangePasswordFormData, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg("");
    setServerError("");

    const result = localizedSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ChangePasswordFormData;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(toApiUrl(`/api/users/${userId}/profile/change-password`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          validationErrors?: { field?: string; message: string }[];
        };

        if (data.validationErrors && data.validationErrors.length > 0) {
          setServerError(data.validationErrors[0].message);
          return;
        }

        setServerError(data.message ?? t("changeFailed"));
        return;
      }

      setSuccessMsg(t("changeSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched({});
      setFieldErrors({});
    } catch (error) {
      logger.error("Change password error", error);
      setServerError(error instanceof Error ? error.message : t("changeFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        {t("title")}
      </Typography>
      <Divider sx={{ mb: 3, borderColor: "border.light" }} />

      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(e);
        }}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <TextField
          id="currentPassword"
          label={t("currentPassword")}
          type={showCurrent ? "text" : "password"}
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={e => {
            setCurrentPassword(e.target.value);
            if (touched.currentPassword) validateField("currentPassword", e.target.value);
          }}
          onBlur={() => {
            handleBlur("currentPassword", currentPassword);
          }}
          error={touched.currentPassword && !!fieldErrors.currentPassword}
          helperText={touched.currentPassword ? fieldErrors.currentPassword : undefined}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("toggleCurrentPasswordAria")}
                    onClick={() => {
                      setShowCurrent(v => !v);
                    }}
                    edge="end"
                    size="small"
                  >
                    {showCurrent ? (
                      <VisibilityOffRoundedIcon fontSize="small" />
                    ) : (
                      <VisibilityRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box>
          <TextField
            id="newPassword"
            label={t("newPassword")}
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value);
              if (touched.newPassword) validateField("newPassword", e.target.value);
            }}
            onBlur={() => {
              handleBlur("newPassword", newPassword);
            }}
            error={touched.newPassword && !!fieldErrors.newPassword}
            helperText={touched.newPassword ? fieldErrors.newPassword : undefined}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("toggleNewPasswordAria")}
                      onClick={() => {
                        setShowNew(v => !v);
                      }}
                      edge="end"
                      size="small"
                    >
                      {showNew ? (
                        <VisibilityOffRoundedIcon fontSize="small" />
                      ) : (
                        <VisibilityRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {newPassword && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 4) * 100}
                color={passwordStrength.color}
                sx={{ height: 4, borderRadius: 999, mb: 0.5 }}
              />
              <Typography variant="caption" color={`${passwordStrength.color}.main`} sx={{ fontWeight: 600 }}>
                {passwordStrength.key ? t(`passwordStrength.${passwordStrength.key}`) : ""}
              </Typography>
            </Box>
          )}
        </Box>

        <TextField
          id="confirmPassword"
          label={t("confirmNewPassword")}
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            if (touched.confirmPassword) validateField("confirmPassword", e.target.value);
          }}
          onBlur={() => {
            handleBlur("confirmPassword", confirmPassword);
          }}
          error={touched.confirmPassword && !!fieldErrors.confirmPassword}
          helperText={touched.confirmPassword ? fieldErrors.confirmPassword : undefined}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t("toggleConfirmPasswordAria")}
                    onClick={() => {
                      setShowConfirm(v => !v);
                    }}
                    edge="end"
                    size="small"
                  >
                    {showConfirm ? (
                      <VisibilityOffRoundedIcon fontSize="small" />
                    ) : (
                      <VisibilityRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1,
            borderTop: theme => `1px solid ${theme.palette.border.light}`,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {successMsg && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                {successMsg}
              </Alert>
            )}
            {serverError && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {serverError}
              </Alert>
            )}
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockResetRoundedIcon />}
            sx={{
              px: 3,
              py: 1.25,
              fontWeight: 700,
              boxShadow: theme => theme.palette.shadow.button,
              "&:hover": { boxShadow: theme => theme.palette.shadow.buttonHover },
            }}
          >
            {loading ? t("changing") : t("changeButton")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
