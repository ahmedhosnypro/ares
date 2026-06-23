import ProfileHeader from "./ProfileHeader";
import PersonalInfoForm from "./PersonalInfoForm";
import AddressForm from "./AddressForm";
import PreferencesSection from "./PreferencesSection";
import VerificationSection from "./VerificationSection";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileCard from "./ProfileCard";
import { Box, CardContent, Container, Grid, Typography } from "@mui/material";
import { type Session } from "next-auth";
import { type ProfileData } from "@/app/(customer)/account/profile/types";

interface SharedProfileContainerProps {
  readonly session: Session;
  readonly profileData: ProfileData;
  readonly showVerification?: boolean;
  readonly showPreferences?: boolean;
  readonly title?: string;
  readonly subtitle?: string;
  readonly children?: React.ReactNode;
}

export default function SharedProfileContainer({
  session,
  profileData,
  showVerification = true,
  showPreferences = true,
  title = "Account Settings",
  subtitle = "Manage your personal information, security, and preferences.",
  children,
}: SharedProfileContainerProps) {
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
  const addressStreet = address.street;
  const addressCity = address.city;
  const addressState = address.state;
  const addressPostalCode = address.postalCode;
  const addressCountry = address.country;
  const emergencyName = emergencyContact.name;
  const emergencyPhone = emergencyContact.phone;
  const emergencyRelationship = emergencyContact.relationship;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" color="text.primary" gutterBottom sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
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

              {showVerification && (
                <VerificationSection
                  accessToken={session.accessToken}
                  initialEmailVerified={verificationStatus.email}
                  initialPhoneVerified={verificationStatus.phone}
                  initialLicenseVerified={verificationStatus.driverLicense}
                  initialKycStatus={verificationStatus.kyc}
                />
              )}

              {showPreferences && (
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
              )}
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
              {children}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
