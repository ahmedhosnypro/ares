"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as SuccessIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

export default function ForgotPasswordForm() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleBlur = () => {
    const result = forgotPasswordSchema.safeParse({ email });
    setEmailError(result.success ? "" : result.error.issues[0]?.message || "Invalid email");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message || "Invalid email");
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
        const data = await res.json().catch(() => null);
        setServerError(data?.message || "Failed to request password reset. Please try again.");
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", background: theme.palette.overlay.gradient }}>
      <Box sx={{ display: "flex", flex: 1, flexDirection: { xs: "column", lg: "row" } }}>
        {/* ── Form side ── */}
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
            {/* Logo */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4 }}>
                <Box sx={{ position: "relative", width: 200, height: 60, display: "flex", alignItems: "center" }}>
                  <Image
                    src="/img/favicon/logo_transparent.png"
                    alt="Ares Logo"
                    fill
                    sizes="200px"
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
            </Box>

            {isSuccess ? (
              <Box sx={{ textAlign: "center", p: 3, bgcolor: "success.light", borderRadius: 3, border: "1px solid", borderColor: "success.main" }}>
                <SuccessIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  If an account exists for <b>{email}</b>, we have sent a password reset link. Please check your inbox.
                </Typography>
                <Button
                  component={Link}
                  href="/sign-in"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ borderRadius: "999px", py: 1.5, fontWeight: 700, textTransform: "none" }}
                >
                  Return to Sign In
                </Button>
              </Box>
            ) : (
              <>
                {serverError && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                    {serverError}
                  </Alert>
                )}

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
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
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Send Reset Link"}
                  </Button>
                </Box>
              </>
            )}

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Remember your password?{" "}
              <MuiLink
                component={Link}
                href="/sign-in"
                sx={{ fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </Box>

        {/* ── Decorative side ── */}
        {!isMobile && (
          <Box sx={{ flex: { lg: "0 0 50%" }, position: "relative", display: { xs: "none", lg: "block" } }}>
            <Paper
              elevation={0}
              sx={{ position: "relative", height: "100%", borderRadius: 0, overflow: "hidden", bgcolor: "transparent" }}
            >
              <Box sx={{ position: "absolute", inset: 0, "& img": { objectFit: "cover", opacity: 0.6 } }}>
                <Image
                  src="https://images.unsplash.com/photo-1503376712351-1f2e82502c89?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Luxury Car Interior"
                  fill
                  sizes="50vw"
                  priority
                />
              </Box>
              <Box sx={{ position: "absolute", inset: 0, background: theme.palette.overlay.tealGradient }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 6, color: "white" }}>
                <Typography variant="h3" component="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: "-0.02em" }}>
                  Seamless Recovery
                </Typography>
                <Typography variant="h6" sx={{ maxWidth: 500, color: "grey.300", fontWeight: 400, lineHeight: 1.6 }}>
                  Don't worry, getting back on the road is just a click away. Let's get you signed back in securely.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
