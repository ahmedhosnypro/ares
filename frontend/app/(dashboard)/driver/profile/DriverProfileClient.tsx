"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
  Chip,
  Stack,
  Divider,
  Paper,
  Avatar,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  DirectionsCar as DirectionsCarIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { format } from "date-fns";

interface ServiceAreaDto {
  id: string;
  name: string;
  governorate: string;
  isActive: boolean;
}

interface DriverProfileDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  licenseImage?: string;
  nationalIdFrontImage?: string;
  nationalIdBackImage?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: string;
  availability: string;
  workAreas: ServiceAreaDto[];
}

export default function DriverProfileClient() {
  const { data: session } = useSession();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfileDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(toApiUrl("/api/driver/profile/me"), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        logger.error("Error fetching driver profile", err);
        setError("Could not load your profile details.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, [session]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Profile not found."}</Alert>
      </Container>
    );
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Driver";
  const initials = profile.firstName?.charAt(0).toUpperCase() || "D";
  const resolvedPhoto = profile.profilePictureUrl ? toImageUrl(profile.profilePictureUrl) : null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 4 }}>
        My Profile
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          boxShadow: theme.palette.shadow.card,
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, mb: 4, flexWrap: "wrap" }}>
          <Avatar
            src={resolvedPhoto || undefined}
            sx={{
              width: 100,
              height: 100,
              bgcolor: "primary.main",
              fontSize: "2.5rem",
              fontWeight: 800,
              boxShadow: `0 0 0 4px ${theme.palette.background.paper}, 0 0 0 6px ${theme.palette.primary.main}`,
            }}
          >
            {!resolvedPhoto && initials}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              {fullName}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Chip label={`Status: ${profile.status}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
              <Chip label={`Availability: ${profile.availability}`} variant="outlined" size="small" />
            </Box>

            <Stack spacing={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">{profile.email}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">{profile.phoneNumber || "No phone provided"}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">{profile.address || "No address provided"}</Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <BadgeIcon color="primary" /> License Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  License Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profile.licenseNumber || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  Expiry Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profile.licenseExpiryDate ? format(new Date(profile.licenseExpiryDate), "MMMM d, yyyy") : "N/A"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <PhoneIcon color="primary" /> Emergency Contact
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  Contact Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profile.emergencyContactName || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  Contact Phone
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profile.emergencyContactPhone || "N/A"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <DirectionsCarIcon color="primary" /> Approved Work Areas
            </Typography>
            {profile.workAreas.length === 0 ? (
              <Typography color="text.secondary">No work areas assigned.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {profile.workAreas.map(area => (
                  <Chip
                    key={area.id}
                    label={`${area.name} (${area.governorate})`}
                    sx={{ borderRadius: 2, fontWeight: 500, bgcolor: "background.default" }}
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
