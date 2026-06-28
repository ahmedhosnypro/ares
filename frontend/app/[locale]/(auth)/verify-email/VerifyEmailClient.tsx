"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import { CheckCircle as CheckCircleIcon, ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { useTranslations } from "next-intl";

interface VerifyEmailClientProps {
  userId?: string;
  token?: string;
}

export default function VerifyEmailClient({ userId, token }: Readonly<VerifyEmailClientProps>) {
  const t = useTranslations("authPages.verifyEmail");
  const [status, setStatus] = useState<"loading" | "success" | "error">(() => {
    if (!userId || !token) return "error";
    return "loading";
  });
  const [errorKey] = useState<string>(() => {
    if (!userId || !token) return "invalidLink";
    return "";
  });
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const effectRan = useRef(false);

  const errorDisplay = apiErrorMessage || (errorKey ? t(errorKey as keyof typeof t) : "");

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
          setApiErrorMessage(data?.message || t("verificationFailed"));
        }
      } catch (_err) {
        logger.error("Email verification error:", _err);
        setStatus("error");
        setApiErrorMessage(t("unexpectedError"));
      }
    };

    void verify();
  }, [userId, token, t]);

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
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 3,
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              {t("loadingTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("loadingMessage")}
            </Typography>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              {t("successTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {t("successMessage")}
            </Typography>
            <Button
              component={Link}
              href="/sign-in"
              variant="contained"
              fullWidth
              size="large"
              sx={{ borderRadius: 999, py: 1.5, fontWeight: "bold" }}
            >
              {t("continueToLogin")}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              {t("errorTitle")}
            </Typography>
            <Alert severity="error" sx={{ mb: 4, textAlign: "left", borderRadius: 2 }}>
              {errorDisplay}
            </Alert>
            <Button
              component={Link}
              href="/sign-in"
              variant="outlined"
              fullWidth
              size="large"
              sx={{ mb: 2, borderRadius: 999, py: 1.5, fontWeight: "bold" }}
            >
              {t("backToLogin")}
            </Button>
            <Button component={Link} href="/sign-up" variant="text" fullWidth sx={{ fontWeight: "bold" }}>
              {t("registerNewAccount")}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
