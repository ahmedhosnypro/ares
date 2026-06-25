"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Alert, Box, CircularProgress, Container, Typography, Chip, Stack, Grid, CardContent } from "@mui/material";
import { Badge as BadgeIcon, DirectionsCar as DirectionsCarIcon } from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { format } from "date-fns";
import SharedProfileContainer from "@/components/profile/SharedProfileContainer";
import ProfileCard from "@/components/profile/ProfileCard";
import { type ProfileData } from "@/app/[locale]/(customer)/account/profile/types";

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

  if (error || !profile || !session) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Profile not found."}</Alert>
      </Container>
    );
  }

  // Parse address fields from flat address string
  const addressParts = profile.address ? profile.address.split(",").map(p => p.trim()) : [];
  const mappedAddress = {
    street: addressParts[0] || "",
    city: addressParts[1] || "",
    state: addressParts[2] || "",
    postalCode: addressParts[3] || "",
    country: addressParts[4] || "",
  };

  // Map to the shared ProfileData interface
  const profileData: ProfileData = {
    userId: session.user.id || "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    emailVerified: profile.status === "Verified",
    phone: profile.phoneNumber ?? "",
    phoneVerified: profile.status === "Verified",
    profileCompleteness: profile.status === "Verified" ? 100 : profile.licenseNumber ? 80 : 40,
    profilePhotoUrl: profile.profilePictureUrl,
    address: mappedAddress,
    emergencyContact: {
      name: profile.emergencyContactName ?? "",
      phone: profile.emergencyContactPhone ?? "",
      relationship: "Emergency",
    },
    verificationStatus: {
      email: profile.status === "Verified",
      phone: profile.status === "Verified",
      driverLicense: profile.status === "Verified",
      kyc: profile.status === "Verified" ? "Approved" : "Pending",
    },
    dateOfBirth: "",
    languagePreference: "en",
    currencyPreference: "USD",
  };

  return (
    <SharedProfileContainer session={session} profileData={profileData} showVerification={true} showPreferences={false}>
      <ProfileCard>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
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
        </CardContent>
      </ProfileCard>
    </SharedProfileContainer>
  );
}
