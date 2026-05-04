"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import Link from "next/link";
import { CheckCircle as CheckCircleIcon, ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface VerifyEmailClientProps {
  userId?: string;
  token?: string;
}

export default function VerifyEmailClient({ userId, token }: Readonly<VerifyEmailClientProps>) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(() => {
    if (!userId || !token) return "error";
    return "loading";
  });
  const [errorMessage, setErrorMessage] = useState(() => {
    if (!userId || !token) return "Invalid verification link. Missing user ID or token.";
    return "";
  });
  const effectRan = useRef(false);

  useEffect(() => {
    if (!userId || !token) {
      return;
    }

    if (effectRan.current) return;
    effectRan.current = true;

    const verify = async () => {
      try {
        const response = await fetch(
          toApiUrl(`/api/auth/verify-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`),
          {
            method: "POST",
          }
        );

        if (response.ok) {
          setStatus("success");
        } else {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          setStatus("error");
          setErrorMessage(data?.message || "Failed to verify email. The link may be expired or invalid.");
        }
      } catch (_err) {
        logger.error("Email verification error:", _err);
        setStatus("error");
        setErrorMessage("An unexpected error occurred while communicating with the server.");
      }
    };

    void verify();
  }, [userId, token]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 450,
          width: "100%",
          p: 5,
          borderRadius: 4,
          bgcolor: "background.paper",
          boxShadow: 3,
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait a moment while we verify your account.
            </Typography>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              Email Verified!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your email address has been successfully verified. You can now log in to your account.
            </Typography>
            <Button
              component={Link}
              href="/sign-in"
              variant="contained"
              fullWidth
              size="large"
              sx={{ borderRadius: 999, py: 1.5, fontWeight: "bold" }}
            >
              Continue to Login
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 4, textAlign: "left", borderRadius: 2 }}>
              {errorMessage}
            </Alert>
            <Button
              component={Link}
              href="/sign-in"
              variant="outlined"
              fullWidth
              size="large"
              sx={{ mb: 2, borderRadius: 999, py: 1.5, fontWeight: "bold" }}
            >
              Back to Login
            </Button>
            <Button component={Link} href="/sign-up" variant="text" fullWidth sx={{ fontWeight: "bold" }}>
              Register a new account
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
