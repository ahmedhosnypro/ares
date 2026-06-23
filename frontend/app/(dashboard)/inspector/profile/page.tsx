"use client";

import { useSession } from "next-auth/react";
import { Box, Typography, Stack, Avatar, CardContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BadgeIcon from "@mui/icons-material/Badge";
import SharedProfileContainer from "@/components/profile/SharedProfileContainer";
import ProfileCard from "@/components/profile/ProfileCard";
import { type ProfileData } from "@/app/(customer)/account/profile/types";

export default function InspectorProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const theme = useTheme();

  if (!user) return null;

  // Map user session to standard ProfileData
  const profileData: ProfileData = {
    userId: user.id || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    emailVerified: true,
    phone: "", // standard inspector has no phone details in default session object
    phoneVerified: true,
    profileCompleteness: 100,
    profilePhotoUrl: user.image ?? undefined,
    address: { street: "", city: "", state: "", postalCode: "", country: "" },
    emergencyContact: { name: "", phone: "", relationship: "" },
    verificationStatus: { email: true, phone: true, driverLicense: false, kyc: "Approved" },
    dateOfBirth: "",
    languagePreference: "en",
    currencyPreference: "USD",
  };

  return (
    <SharedProfileContainer
      session={session}
      profileData={profileData}
      showVerification={false}
      showPreferences={false}
      title="Inspector Profile"
      subtitle="Your personal and employee information."
    >
      <ProfileCard>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Employee Credentials
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: theme.palette.icon.business.bg, color: theme.palette.icon.business.color }}>
              <BadgeIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Assigned Employee Roles
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                {user.roles.join(", ")}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </ProfileCard>
    </SharedProfileContainer>
  );
}
