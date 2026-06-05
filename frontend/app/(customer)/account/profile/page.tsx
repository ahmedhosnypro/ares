import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { type ProfileData } from "./types";
import { logger } from "@/utils/logger";
import ProfileHeader from "./_components/ProfileHeader";
import PersonalInfoForm from "./_components/PersonalInfoForm";
import AddressForm from "./_components/AddressForm";
import PreferencesSection from "./_components/PreferencesSection";
import VerificationSection from "./_components/VerificationSection";
import ChangePasswordForm from "./_components/ChangePasswordForm";
import ProfileCard from "./_components/ProfileCard";
import { Alert, Box, Button, CardContent, Container, Grid, Typography } from "@mui/material";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id || !session.accessToken) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <ProfileCard>
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
              <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
                Sign in required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Please sign in to access your account settings.
              </Typography>
              <Link href="/sign-in" style={{ textDecoration: "none" }}>
                <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </ProfileCard>
        </Container>
      </Box>
    );
  }

  let profileData: ProfileData | null = null;
  let errorType: string | null = null;
  let errorMessage: string | null = null;

  logger.info("Profile page - Session info", {
    userId: session.user.id,
    hasAccessToken: !!session.accessToken,
  });

  try {
    const url = toApiUrl(`/api/users/${session.user.id}/profile`);
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (response.ok) {
      const raw: unknown = await response.json();
      profileData = raw as ProfileData;
    } else {
      const errorBody = await response.text();
      logger.error("Profile fetch failed", { status: response.status, errorBody });

      if (response.status === 401 || response.status === 403) {
        errorType = "auth";
        errorMessage = "Your session has expired. Please sign in again.";
      } else if (response.status === 404) {
        errorType = "notfound";
        errorMessage = "Profile not found. Please contact support.";
      } else if (response.status >= 500) {
        errorType = "server";
        errorMessage = "Server error. Please try again in a moment.";
      } else {
        errorType = "unknown";
        errorMessage = `Unable to load profile (Error ${String(response.status)}).`;
      }
    }
  } catch (error) {
    logger.error("Profile fetch error", { error });
    errorType = "network";
    errorMessage = "Network error. Please check your connection and try again.";
  }

  if (!profileData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <ProfileCard>
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
              <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                {errorMessage ?? "Please try again in a moment."}
              </Alert>
              {errorType === "auth" ? (
                <Link href="/sign-in" style={{ textDecoration: "none" }}>
                  <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                    Sign In Again
                  </Button>
                </Link>
              ) : (
                <Link href="/account/profile" style={{ textDecoration: "none" }}>
                  <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                    Try Again
                  </Button>
                </Link>
              )}
            </CardContent>
          </ProfileCard>
        </Container>
      </Box>
    );
  }

  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    profilePhotoUrl,
    profileCompleteness,
    dateOfBirth,
    languagePreference,
    currencyPreference,
  } = profileData;

  const address = profileData.address;
  const emergencyContact = profileData.emergencyContact;
  const verificationStatus = profileData.verificationStatus;
  const addressStreet: string = address.street;
  const addressCity: string = address.city;
  const addressState: string = address.state;
  const addressPostalCode: string = address.postalCode;
  const addressCountry: string = address.country;
  const emergencyName: string = emergencyContact.name;
  const emergencyPhone: string = emergencyContact.phone;
  const emergencyRelationship: string = emergencyContact.relationship;

  const isAdmin = session.user.roles.includes("Admin");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" color="text.primary" gutterBottom sx={{ fontWeight: 800 }}>
            Account Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your personal information, security, and preferences.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <ProfileCard>
                <ProfileHeader
                  userId={userId}
                  accessToken={session.accessToken}
                  photoUrl={profilePhotoUrl}
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  completeness={profileCompleteness}
                />
              </ProfileCard>

              {!isAdmin && (
                <VerificationSection
                  accessToken={session.accessToken}
                  initialEmailVerified={verificationStatus.email}
                  initialPhoneVerified={verificationStatus.phone}
                  initialLicenseVerified={verificationStatus.driverLicense}
                  initialKycStatus={verificationStatus.kyc}
                />
              )}

              <ProfileCard>
                <PreferencesSection
                  userId={userId}
                  accessToken={session.accessToken}
                  languagePreference={languagePreference}
                  currencyPreference={currencyPreference}
                  firstName={firstName}
                  lastName={lastName}
                  phone={phone}
                  dateOfBirth={dateOfBirth}
                  addressStreet={addressStreet}
                  addressCity={addressCity}
                  addressState={addressState}
                  addressPostalCode={addressPostalCode}
                  addressCountry={addressCountry}
                  emergencyName={emergencyName}
                  emergencyPhone={emergencyPhone}
                  emergencyRelationship={emergencyRelationship}
                />
              </ProfileCard>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <ProfileCard>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <PersonalInfoForm
                    userId={userId}
                    accessToken={session.accessToken}
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    phone={phone}
                    dateOfBirth={dateOfBirth}
                    addressStreet={addressStreet}
                    addressCity={addressCity}
                    addressState={addressState}
                    addressPostalCode={addressPostalCode}
                    addressCountry={addressCountry}
                    emergencyName={emergencyName}
                    emergencyPhone={emergencyPhone}
                    emergencyRelationship={emergencyRelationship}
                    languagePreference={languagePreference}
                    currencyPreference={currencyPreference}
                  />
                </CardContent>
              </ProfileCard>

              <ProfileCard>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <AddressForm
                    userId={userId}
                    accessToken={session.accessToken}
                    addressStreet={addressStreet}
                    addressCity={addressCity}
                    addressState={addressState}
                    addressPostalCode={addressPostalCode}
                    addressCountry={addressCountry}
                    emergencyName={emergencyName}
                    emergencyPhone={emergencyPhone}
                    emergencyRelationship={emergencyRelationship}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    dateOfBirth={dateOfBirth}
                    languagePreference={languagePreference}
                    currencyPreference={currencyPreference}
                  />
                </CardContent>
              </ProfileCard>

              <ProfileCard>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <ChangePasswordForm userId={userId} accessToken={session.accessToken} />
                </CardContent>
              </ProfileCard>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
