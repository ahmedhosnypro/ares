"use client";

import React, { useState } from "react";
import { Link } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Email as EmailIcon,
  ErrorOutlined as ErrorIcon,
  CheckCircleOutlined as SuccessIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { z } from "zod";
import { emailSchema } from "@/lib/validation/schemas";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export default function ForgotPasswordForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const t = useTranslations("authPages.forgotPassword");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleBlur = () => {
    const result = forgotPasswordSchema.safeParse({ email });
    setEmailError(result.success ? "" : result.error.issues[0]?.message || t("invalidEmail"));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message || t("invalidEmail"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(toApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = (await res.json().catch((err: unknown) => {
          logger.error("Failed to parse forgot password error response", err);
          return null;
        })) as { message?: string } | null;
        setServerError(data?.message || t("resetFailed"));
      }
    } catch (error) {
      logger.error("Forgot password request failed", error);
      setServerError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
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
              <Typography variant="body2" color="text.secondary">
                {t("subtitle")}
              </Typography>
            </Box>

            {isSuccess ? (
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
                <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
                  {t("successTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("successMessage", { email })}
                </Typography>
                <Button
                  component={Link}
                  href="/sign-in"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ borderRadius: "999px", py: 1.5, fontWeight: 700, textTransform: "none" }}
                >
                  {t("returnToSignIn")}
                </Button>
              </Box>
            ) : (
              <>
                {serverError && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>{t("errorTitle")}</AlertTitle>
                    {serverError}
                  </Alert>
                )}

                <Box
                  component="form"
                  onSubmit={(e: React.SubmitEvent<HTMLFormElement>) => {
                    void handleSubmit(e);
                  }}
                  noValidate
                >
                  {" "}
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label={t("emailLabel")}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={handleBlur}
                    error={!!emailError}
                    helperText={emailError}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
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
                    disabled={isLoading || !email}
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
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : t("sendResetLink")}
                  </Button>
                </Box>
              </>
            )}

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              {t("rememberPassword")}{" "}
              <MuiLink
                component={Link}
                href="/sign-in"
                sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                {t("signInLink")}
              </MuiLink>
            </Typography>
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
                  src="https://images.unsplash.com/photo-1503376712351-1f2e82502c89?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
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
