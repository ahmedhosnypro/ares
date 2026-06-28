"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Link } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ErrorOutlined as ErrorIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircleOutlined as SuccessIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { z } from "zod";

interface ResetPasswordClientProps {
  readonly email?: string;
  readonly token?: string;
}

function createResetPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      newPassword: z
        .string()
        .min(8, t("validationMinLength"))
        .regex(/[A-Z]/, t("validationUppercase"))
        .regex(/[a-z]/, t("validationLowercase"))
        .regex(/\d/, t("validationNumber"))
        .regex(/[^A-Za-z0-9]/, t("validationSpecialChar")),
      confirmPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t("validationPasswordsMatch"),
      path: ["confirmPassword"],
    });
}

function getPasswordStrength(password: string, t: (key: string) => string) {
  if (!password) return { score: 0, label: "", color: "error" as const };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  const levels = [
    { score: 1, label: t("passwordWeak"), color: "error" as const },
    { score: 2, label: t("passwordFair"), color: "warning" as const },
    { score: 3, label: t("passwordGood"), color: "info" as const },
    { score: 4, label: t("passwordStrong"), color: "success" as const },
  ];
  return levels[score - 1] ?? { score: 0, label: t("passwordTooShort"), color: "error" as const };
}

export default function ResetPasswordClient({ email, token }: ResetPasswordClientProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const t = useTranslations("authPages.resetPassword");

  const resetPasswordSchema = useMemo(() => createResetPasswordSchema(t), [t]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof z.infer<typeof resetPasswordSchema>, string>>>(
    {}
  );
  const [touched, setTouched] = useState<Partial<Record<keyof z.infer<typeof resetPasswordSchema>, boolean>>>({});

  const passwordStrength = getPasswordStrength(newPassword, t);

  const isLinkInvalid = !email || !token;

  const validateField = useCallback(
    (field: keyof z.infer<typeof resetPasswordSchema>, value: string) => {
      if (field === "confirmPassword") {
        const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword: value });
        const issue = result.success ? undefined : result.error.issues.find(i => i.path[0] === "confirmPassword");
        setFieldErrors(prev => ({ ...prev, confirmPassword: issue?.message }));
        return;
      }
      const result = resetPasswordSchema.shape[field].safeParse(value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    },
    [newPassword, resetPasswordSchema]
  );

  const handleBlur = (field: keyof z.infer<typeof resetPasswordSchema>, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const errors: Partial<Record<keyof z.infer<typeof resetPasswordSchema>, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof z.infer<typeof resetPasswordSchema>;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setTouched({ newPassword: true, confirmPassword: true });
      return;
    }

    if (isLinkInvalid) {
      setServerError(t("invalidResetLink"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(toApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decodeURIComponent(email),
          token: decodeURIComponent(token),
          newPassword,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setServerError(data?.message || t("resetFailed"));
      }
    } catch (_error) {
      logger.error("Reset password failed", _error);
      setServerError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !isLoading && newPassword.length > 0 && confirmPassword.length > 0 && !isLinkInvalid;

  const renderStatus = () => {
    if (isSuccess) {
      return (
        <Box
          sx={{
            textAlign: "center",
            p: 3,
            bgcolor: "success.light",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "success.main",
          }}
        >
          <SuccessIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {t("successTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("successMessage")}
          </Typography>
          <Button
            component={Link}
            href="/sign-in"
            variant="contained"
            fullWidth
            size="large"
            sx={{ borderRadius: "999px", py: 1.5, fontWeight: 700, textTransform: "none" }}
          >
            {t("goToSignIn")}
          </Button>
        </Box>
      );
    }

    if (isLinkInvalid) {
      return (
        <Box
          sx={{
            textAlign: "center",
            p: 3,
            bgcolor: "error.light",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "error.main",
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {t("invalidLinkTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("invalidLinkMessage")}
          </Typography>
          <Button
            component={Link}
            href="/forgot-password"
            variant="contained"
            fullWidth
            size="large"
            sx={{ borderRadius: "999px", py: 1.5, fontWeight: 700, textTransform: "none" }}
          >
            {t("requestNewLink")}
          </Button>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", background: theme.palette.overlay.gradient }}>
      <Box sx={{ display: "flex", flex: 1, flexDirection: { xs: "column", lg: "row" } }}>
        <Box
          sx={{
            flex: { xs: "1 1 auto", lg: "0 0 50%" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 2, sm: 4, lg: 8 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 480,
              mx: "auto",
              bgcolor: "background.paper",
              borderRadius: "24px",
              p: { xs: 4, sm: 6 },
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.border.main}`,
            }}
          >
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4 }}>
                <Box sx={{ position: "relative", width: 200, height: 60, display: "flex", alignItems: "center" }}>
                  <Image
                    src="/img/favicon/logo_transparent.png"
                    alt={t("logoAlt")}
                    fill
                    sizes="200px"
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                {t("title")}
              </Typography>
              {!isSuccess && (
                <Typography variant="body2" color="text.secondary">
                  {t("subtitle")}
                </Typography>
              )}
            </Box>

            {renderStatus() || (
              <>
                {serverError && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>{t("errorTitle")}</AlertTitle>
                    {serverError}
                  </Alert>
                )}

                <Box
                  component="form"
                  onSubmit={e => {
                    void handleSubmit(e);
                  }}
                  noValidate
                >
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      id="newPassword"
                      name="newPassword"
                      label={t("newPasswordLabel")}
                      type={showPassword ? "text" : "password"}
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
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={t("togglePassword")}
                                onClick={() => {
                                  setShowPassword(!showPassword);
                                }}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {newPassword && (
                      <Box sx={{ mt: 1, px: 1 }}>
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
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t("confirmPasswordLabel")}
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
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t("toggleConfirmPassword")}
                              onClick={() => {
                                setShowConfirm(!showConfirm);
                              }}
                              edge="end"
                            >
                              {showConfirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ mb: 4 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!canSubmit}
                    sx={{
                      py: 1.75,
                      fontSize: "1rem",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: "999px",
                      boxShadow: theme.palette.shadow.button,
                      "&:hover": { boxShadow: theme.palette.shadow.buttonHover },
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : t("resetButton")}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {!isMobile && (
          <Box sx={{ flex: { lg: "0 0 50%" }, position: "relative", display: { xs: "none", lg: "block" } }}>
            <Paper
              elevation={0}
              sx={{ position: "relative", height: "100%", borderRadius: 0, overflow: "hidden", bgcolor: "transparent" }}
            >
              <Box sx={{ position: "absolute", inset: 0, "& img": { objectFit: "cover", opacity: 0.6 } }}>
                <Image
                  src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt={t("carImageAlt")}
                  fill
                  sizes="50vw"
                  priority
                />
              </Box>
              <Box sx={{ position: "absolute", inset: 0, background: theme.palette.overlay.tealGradient }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 6, color: "common.white" }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.02em" }}>
                  {t("decorativeTitle")}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ maxWidth: 500, color: "text.secondary", fontWeight: 400, lineHeight: 1.6 }}
                >
                  {t("decorativeSubtitle")}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
