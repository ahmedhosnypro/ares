"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

/**
 * Client portion of the /complete-profile page.
 *
 * Behaviour:
 *   - Reads first/last name + phone from the active NextAuth session as
 *     prefill (the values the user gave at sign-up).
 *   - Lets the user confirm or edit them, then POSTs to
 *     `/api/auth/complete-profile`, which flips `ApplicationUser.Status`
 *     from "Pending" to "Active".
 *   - On success: refreshes the session (so the new Status is picked up)
 *     and routes the user to their role-appropriate landing surface:
 *       - Supplier → /supplier/dashboard
 *       - Customer / anything else → /
 *   - If the visitor is not signed in, we bounce them to /sign-in.
 *   - If the visitor is already Active, we route them straight to their
 *     landing surface — no point making them resubmit the form.
 *
 * Design uses the existing MUI primitives so the page sits naturally
 * alongside the rest of the auth flow without a redesign.
 */
export default function CompleteProfileClient() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session, status: sessionStatus, update } = useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve where to land the user after completion based on their roles.
  const landingPath = useMemo(() => {
    const roles = session?.user.roles ?? [];
    if (roles.includes("Supplier")) return "/supplier/dashboard";
    return "/";
  }, [session?.user.roles]);

  // Bootstrap: prefill from the session, or bounce away if the user
  // doesn't need to be here.
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      router.replace("/sign-in?callbackUrl=/complete-profile");
      return;
    }
    if (session?.user) {
      setFirstName(session.user.firstName || "");
      setLastName(session.user.lastName || "");
    }
  }, [router, session, sessionStatus]);

  const canSubmit = !isSaving && firstName.trim().length > 0 && lastName.trim().length > 0 && phone.trim().length > 0;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const accessToken = session?.accessToken;
    if (!accessToken) {
      router.replace("/sign-in?callbackUrl=/complete-profile");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(toApiUrl("/api/auth/complete-profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "We couldn't save your profile. Please try again.");
        return;
      }

      // Refresh the next-auth session so the new Status propagates.
      // Best-effort — if the update fails, the next page load picks it up.
      try {
        await update();
      } catch (refreshError) {
        logger.warn("Could not refresh session after profile completion", refreshError);
      }

      router.replace(landingPath);
      router.refresh();
    } catch (err) {
      logger.error("Profile completion request failed", err);
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Already-active users don't need this screen.
  useEffect(() => {
    if (session?.user.status && session.user.status.toLowerCase() === "active") {
      router.replace(landingPath);
    }
  }, [landingPath, router, session?.user.status]);

  if (sessionStatus === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: theme.palette.overlay.gradient, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 3,
            p: { xs: 3, sm: 5 },
            boxShadow: theme.palette.shadow.card,
            border: `1px solid ${theme.palette.border.main}`,
          }}
        >
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Complete your profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confirm your details to finish setting up your ARES account. You can change them later in your profile
              settings.
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={e => {
              void handleSubmit(e);
            }}
            noValidate
          >
            <Stack spacing={2.5}>
              <TextField
                label="First name"
                value={firstName}
                onChange={e => {
                  setFirstName(e.target.value);
                }}
                required
                fullWidth
                autoComplete="given-name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={e => {
                  setLastName(e.target.value);
                }}
                required
                fullWidth
                autoComplete="family-name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Phone number"
                type="tel"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                }}
                required
                fullWidth
                autoComplete="tel"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!canSubmit}
                startIcon={isSaving ? null : <CheckCircleRoundedIcon />}
                sx={{
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                {isSaving ? <CircularProgress size={22} color="inherit" /> : "Save and continue"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
