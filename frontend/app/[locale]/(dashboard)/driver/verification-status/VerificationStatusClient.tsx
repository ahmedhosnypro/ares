"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { Box, Button, CircularProgress, Container, Paper, Typography, Alert, AlertTitle } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  HourglassEmpty as PendingIcon,
  CheckCircleOutlined as ApprovedIcon,
  ErrorOutlined as RejectedIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface ProfileStatus {
  status: "Incomplete" | "PendingVerification" | "Verified" | "Rejected" | "Suspended";
  rejectionReason?: string | null;
}

export default function VerificationStatusClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(toApiUrl("/api/driver/profile/me/status"), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch profile status");
        }

        const data = await res.json();
        setProfileStatus(data);

        if (data.status === "Verified") {
          router.push("/driver/dashboard");
        } else if (data.status === "Incomplete") {
          router.push("/driver/complete-profile");
        }
      } catch (err) {
        logger.error("Error fetching driver profile status", err);
        setError("Could not load your verification status. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, [session, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const isPending = profileStatus?.status === "PendingVerification";
  const isRejected = profileStatus?.status === "Rejected";
  const isSuspended = profileStatus?.status === "Suspended";

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 2,
          boxShadow: theme.palette.shadow.card,
          border: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Box sx={{ mb: 3 }}>
          {isPending && <PendingIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />}
          {(isRejected || isSuspended) && <RejectedIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />}
          {profileStatus?.status === "Verified" && <ApprovedIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />}

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            {isPending && "Verification Pending"}
            {isRejected && "Application Rejected"}
            {isSuspended && "Account Suspended"}
            {profileStatus?.status === "Verified" && "Account Verified"}
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {isPending &&
              "Your driver profile is currently under review by our admin team. We will notify you once it has been approved."}
            {isRejected &&
              "Unfortunately, your driver application was not approved. Please review the reason below and update your documents."}
            {isSuspended && "Your driver account has been suspended. Please contact support for more information."}
            {profileStatus?.status === "Verified" && "Your profile is approved. Redirecting to your dashboard..."}
          </Typography>

          {isRejected && profileStatus?.rejectionReason && (
            <Alert severity="error" variant="outlined" sx={{ textAlign: "left", mb: 4 }}>
              <AlertTitle sx={{ fontWeight: 700 }}>Reason for Rejection</AlertTitle>
              {profileStatus.rejectionReason}
            </Alert>
          )}

          {isPending && (
            <Button
              variant="outlined"
              onClick={() => {
                window.location.reload();
              }}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Refresh Status
            </Button>
          )}

          {isRejected && (
            <Button
              variant="contained"
              onClick={() => {
                router.push("/driver/complete-profile");
              }}
              sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 700 }}
            >
              Update Profile
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
