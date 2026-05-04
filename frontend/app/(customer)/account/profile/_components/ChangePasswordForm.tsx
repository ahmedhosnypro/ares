"use client";

import React, { useState } from "react";
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
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validation/schemas";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface ChangePasswordFormProps {
  readonly userId: string;
  readonly accessToken: string;
}

type FieldErrors = Partial<Record<keyof ChangePasswordFormData, string>>;

// Reuse the same strength logic as sign-up
function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "error" as const };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  const levels = [
    { score: 1, label: "Weak", color: "error" as const },
    { score: 2, label: "Fair", color: "warning" as const },
    { score: 3, label: "Good", color: "info" as const },
    { score: 4, label: "Strong", color: "success" as const },
  ];
  return levels[score - 1] ?? { score: 0, label: "Too short", color: "error" as const };
}

export default function ChangePasswordForm({ userId, accessToken }: ChangePasswordFormProps) {
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
    // For confirmPassword we need to validate the whole object to catch the refine
    if (field === "confirmPassword") {
      const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword: value });
      const issue = result.success ? undefined : result.error.issues.find(i => i.path[0] === "confirmPassword");
      setFieldErrors(prev => ({ ...prev, confirmPassword: issue?.message }));
      return;
    }
    const result = changePasswordSchema.shape[field].safeParse(value);
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

    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
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
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to change password.");
      }

      setSuccessMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTouched({});
      setFieldErrors({});
    } catch (error) {
      logger.error("Change password error", error);
      setServerError(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
        Change Password
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
          label="Current Password"
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
                    aria-label="toggle current password visibility"
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
            label="New Password"
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
                      aria-label="toggle new password visibility"
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
                {passwordStrength.label}
              </Typography>
            </Box>
          )}
        </Box>

        <TextField
          id="confirmPassword"
          label="Confirm New Password"
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
                    aria-label="toggle confirm password visibility"
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
            borderTop: t => `1px solid ${t.palette.border.light}`,
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
              boxShadow: t => t.palette.shadow.button,
              "&:hover": { boxShadow: t => t.palette.shadow.buttonHover },
            }}
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
