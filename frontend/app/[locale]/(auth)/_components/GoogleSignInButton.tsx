"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import { signIn, getSession } from "next-auth/react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { logger } from "@/utils/logger";

type GoogleRole = "Customer" | "Supplier" | "Driver";

const GOOGLE_GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (
    notification?: (n: {
      isNotDisplayed?: () => boolean;
      isSkippedMoment?: () => boolean;
      isDismissedMoment?: () => boolean;
      getNotDisplayedReason?: () => string;
      getSkippedReason?: () => string;
      getDismissedReason?: () => string;
    }) => void
  ) => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

interface GoogleSignInButtonProps {
  readonly label?: string;
  readonly onCancel?: () => void;
  readonly onError?: (message: string) => void;
  readonly disabled?: boolean;
  readonly requireRole?: boolean;
  readonly initialRole?: GoogleRole;
}

export default function GoogleSignInButton({
  label,
  onCancel,
  onError,
  disabled = false,
  requireRole = true,
  initialRole = "Customer",
}: GoogleSignInButtonProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const t = useTranslations("authPages.googleSignIn");

  const displayLabel = label ?? t("defaultLabel");

  const googleRoles = [
    { value: "Customer" as GoogleRole, label: t("roleCustomerLabel"), description: t("roleCustomerDesc") },
    { value: "Supplier" as GoogleRole, label: t("roleSupplierLabel"), description: t("roleSupplierDesc") },
    { value: "Driver" as GoogleRole, label: t("roleDriverLabel"), description: t("roleDriverDesc") },
  ];

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<GoogleRole>(initialRole);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    setSelectedRole(initialRole);
  }, [initialRole]);

  const selectedRoleRef = useRef<GoogleRole>(selectedRole);
  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const isConfigured = clientId.trim().length > 0;

  const handleSuccess = useCallback(
    async (response: GoogleCredentialResponse) => {
      const idToken = response.credential;
      if (!idToken) {
        setIsPrompting(false);
        onError?.(t("noCredential"));
        return;
      }

      setIsPrompting(false);
      setIsExchanging(true);

      try {
        const res = await signIn("credentials", {
          redirect: false,
          googleIdToken: idToken,
          googleRole: selectedRoleRef.current,
        });

        if (res?.error) {
          onError?.(res.error);
          logger.error("Google sign-in error:", res.error);
          return;
        }

        if (res?.ok) {
          const session = await getSession();
          if (callbackUrl) {
            router.push(callbackUrl);
          } else if (session?.user.roles.includes("Admin")) {
            router.push("/admin");
          } else if (session?.user.roles.includes("Supplier")) {
            router.push("/supplier/dashboard");
          } else if (session?.user.roles.includes("Driver")) {
            router.push("/driver/dashboard");
          } else if (session?.user.roles.includes("Inspector")) {
            router.push("/inspector");
          } else {
            router.push("/");
          }
          router.refresh();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("unexpectedError");
        onError?.(message);
        logger.error("Google sign-in exception:", error);
      } finally {
        setIsExchanging(false);
      }
    },
    [callbackUrl, onError, router, t]
  );

  const handleSuccessRef = useRef(handleSuccess);
  useEffect(() => {
    handleSuccessRef.current = handleSuccess;
  }, [handleSuccess]);

  useEffect(() => {
    if (!scriptLoaded || !isConfigured || !window.google?.accounts.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp: GoogleCredentialResponse) => {
        void handleSuccessRef.current(resp);
      },
      ux_mode: "popup",
      auto_select: false,
      use_fedcm_for_prompt: true,
    });
  }, [scriptLoaded, isConfigured, clientId]);

  const triggerGooglePrompt = useCallback(() => {
    if (!window.google?.accounts.id) {
      onError?.(t("stillLoading"));
      return;
    }
    setIsPrompting(true);
    window.google.accounts.id.prompt(notification => {
      const notDisplayed = notification.isNotDisplayed?.() === true;
      const skipped = notification.isSkippedMoment?.() === true;
      const dismissed = notification.isDismissedMoment?.() === true;

      if (notDisplayed || skipped) {
        setIsPrompting(false);
        const reason = notification.getNotDisplayedReason?.() ?? notification.getSkippedReason?.() ?? "unknown_reason";
        logger.warn("Google prompt was not displayed:", reason);
        onError?.(t("cancelled"));
        return;
      }

      if (dismissed) {
        const reason = notification.getDismissedReason?.() ?? "";
        if (reason !== "credential_returned") {
          setIsPrompting(false);
        }
      }
    });
  }, [onError, t]);

  const showRoleDialog = () => {
    setDialogOpen(true);
  };
  const skipToGoogle = () => {
    triggerGooglePrompt();
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    onCancel?.();
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    triggerGooglePrompt();
  };

  const isWorking = isPrompting || isExchanging;

  if (!isConfigured) {
    return null;
  }

  return (
    <>
      <Script
        src={GOOGLE_GSI_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          onError?.(t("loadFailed"));
        }}
      />

      <Button
        type="button"
        fullWidth
        variant="outlined"
        size="large"
        onClick={requireRole ? showRoleDialog : skipToGoogle}
        disabled={disabled || isWorking}
        startIcon={isWorking ? null : <GoogleGlyph />}
        sx={{
          py: 1.5,
          fontSize: "1rem",
          fontWeight: 600,
          textTransform: "none",
          borderRadius: "999px",
          borderColor: theme.palette.border.main,
          color: "text.primary",
          backgroundColor: "background.paper",
          "&:hover": {
            borderColor: theme.palette.text.primary,
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        {isWorking ? <CircularProgress size={22} color="inherit" /> : displayLabel}
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogCancel}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 2, p: 1 } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("chooseRole")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("roleDialogDescription")}
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              name="google-role"
              value={selectedRole}
              onChange={e => {
                setSelectedRole(e.target.value as GoogleRole);
              }}
            >
              {googleRoles.map(role => (
                <FormControlLabel
                  key={role.value}
                  value={role.value}
                  control={<Radio />}
                  sx={{
                    alignItems: "flex-start",
                    mb: 1,
                    "& .MuiFormControlLabel-label": { width: "100%" },
                  }}
                  label={
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {role.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogCancel} sx={{ textTransform: "none", fontWeight: 600 }}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDialogConfirm}
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "999px", px: 3 }}
          >
            {t("confirmGoogle")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const GOOGLE_BRAND_YELLOW = "#FFC107";
const GOOGLE_BRAND_RED = "#FF3D00";
const GOOGLE_BRAND_GREEN = "#4CAF50";
const GOOGLE_BRAND_BLUE = "#1976D2";

function GoogleGlyph() {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      sx={{ width: 20, height: 20 }}
      aria-hidden
    >
      <path
        fill={GOOGLE_BRAND_YELLOW}
        d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.1-3-.4-4.5z"
      />
      <path
        fill={GOOGLE_BRAND_RED}
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.6 8.6 6.3 14.7z"
      />
      <path
        fill={GOOGLE_BRAND_GREEN}
        d="M24 45.5c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.5 36.5 26.9 37.5 24 37.5c-5.1 0-9.5-3.3-11.2-7.9l-6.6 5.1C9.6 41.4 16.3 45.5 24 45.5z"
      />
      <path
        fill={GOOGLE_BRAND_BLUE}
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.5 5.5c-.5.4 6.6-4.8 6.6-14.1 0-1.5-.1-3-.4-4.5z"
      />
    </Box>
  );
}
