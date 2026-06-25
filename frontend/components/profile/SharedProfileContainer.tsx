"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import ProfileHeader from "./ProfileHeader";
import PersonalInfoForm from "./PersonalInfoForm";
import AddressForm from "./AddressForm";
import PreferencesSection from "./PreferencesSection";
import VerificationStatus from "./VerificationStatus";
import IdentityVerificationModal from "./IdentityVerificationModal";
import DriverLicenseModal from "./DriverLicenseModal";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileCard from "./ProfileCard";
import { Box, CardContent, Grid, Button, Card, Fade, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { type Session } from "next-auth";
import { type ProfileData } from "@/app/[locale]/(customer)/account/profile/types";
import { getMyVerification, type UserVerificationDto } from "@/api-clients/verifications/verifications";
import {
  getMyDriverLicense,
  type DriverLicenseDto,
  type DriverLicenseVerificationState,
} from "@/api-clients/driver-license/driver-license";
import { logger } from "@/utils/logger";

interface SharedProfileContainerProps {
  readonly session: Session;
  readonly profileData: ProfileData;
  readonly showVerification?: boolean;
  readonly showPreferences?: boolean;
  readonly children?: React.ReactNode;
}

type LoadState = "loading" | "ready" | "error";

type TabType = "general" | "address" | "security" | "docs" | "preferences";

function deriveLicenseState(
  license: DriverLicenseDto | null,
  initialLicenseVerified: boolean
): DriverLicenseVerificationState {
  if (!license) return initialLicenseVerified ? "Verified" : "NotSubmitted";
  if (license.verificationState) return license.verificationState;
  return license.isVerified ? "Verified" : "Pending";
}

interface CompletenessInput {
  readonly isInspector: boolean;
  readonly kycStatus: string;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
  readonly licenseVerified: boolean;
  readonly profileCompleteness: number;
}

function computeInspectorCompleteness(
  isKycVerified: boolean,
  emailVerified: boolean,
  phoneVerified: boolean,
  profileCompleteness: number
): number {
  const allMandatory = isKycVerified && emailVerified && phoneVerified;
  if (allMandatory) return profileCompleteness;

  const emailScore = emailVerified ? 20 : 0;
  const phoneScore = phoneVerified ? 20 : 0;
  const kycScore = isKycVerified ? 60 : 0;

  const dynamicScore = emailScore + phoneScore + kycScore;
  const baseScore = profileCompleteness >= 100 ? 80 : profileCompleteness;
  return Math.min(baseScore, dynamicScore, 95);
}

function computeRegularCompleteness(
  isKycVerified: boolean,
  emailVerified: boolean,
  phoneVerified: boolean,
  licenseVerified: boolean,
  profileCompleteness: number
): number {
  const allMandatory = isKycVerified && emailVerified && phoneVerified && licenseVerified;
  if (allMandatory) return profileCompleteness;

  const emailScore = emailVerified ? 20 : 0;
  const phoneScore = phoneVerified ? 20 : 0;
  const kycScore = isKycVerified ? 30 : 0;
  const licenseScore = licenseVerified ? 30 : 0;

  const dynamicScore = emailScore + phoneScore + kycScore + licenseScore;
  const baseScore = profileCompleteness >= 100 ? 80 : profileCompleteness;
  return Math.min(baseScore, dynamicScore, 95);
}

function computeProfileCompleteness(input: CompletenessInput): number {
  const { isInspector, kycStatus, emailVerified, phoneVerified, licenseVerified, profileCompleteness } = input;
  const isKycVerified = ["approved", "basic", "standard", "enhanced"].includes(kycStatus.toLowerCase());

  if (isInspector) {
    return computeInspectorCompleteness(isKycVerified, emailVerified, phoneVerified, profileCompleteness);
  }
  return computeRegularCompleteness(isKycVerified, emailVerified, phoneVerified, licenseVerified, profileCompleteness);
}

export default function SharedProfileContainer({
  session,
  profileData,
  showVerification = true,
  showPreferences = true,
  children,
}: SharedProfileContainerProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("general");

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

  // Identity state
  const [verificationState, setVerificationState] = useState<LoadState>("loading");
  const [verification, setVerification] = useState<UserVerificationDto | null>(null);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);

  // License state
  const [licenseState, setLicenseState] = useState<LoadState>("loading");
  const [license, setLicense] = useState<DriverLicenseDto | null>(null);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  // Load identity verification
  const loadVerification = useCallback(async () => {
    setVerificationState("loading");
    try {
      const data = await getMyVerification(session.accessToken);
      setVerification(data);
      setVerificationState("ready");
    } catch (error) {
      logger.error("Failed to load verification status client-side", error);
      setVerificationState("error");
    }
  }, [session.accessToken]);

  // Load driver license
  const loadLicense = useCallback(async () => {
    setLicenseState("loading");
    try {
      const data = await getMyDriverLicense(session.accessToken);
      setLicense(data);
      setLicenseState("ready");
    } catch (error) {
      logger.error("Failed to load driver license status client-side", error);
      setLicenseState("error");
    }
  }, [session.accessToken]);

  useEffect(() => {
    if (showVerification) {
      void loadVerification();
      void loadLicense();
    }
  }, [showVerification, loadVerification, loadLicense]);

  // Determine KYC status for summary card
  const kycStatus = useMemo(() => {
    if (verificationState === "loading") {
      return verificationStatus.kyc;
    }
    return verification?.status ?? "NotVerified";
  }, [verificationState, verification, verificationStatus.kyc]);

  // Determine license statuses for summary card
  const licenseStateEnum = useMemo(() => {
    if (licenseState === "loading") {
      return verificationStatus.driverLicense ? "Verified" : "NotSubmitted";
    }
    return deriveLicenseState(license, verificationStatus.driverLicense);
  }, [licenseState, license, verificationStatus.driverLicense]);

  const licenseVerified = licenseStateEnum === "Verified";
  const licensePending = licenseStateEnum === "Pending";

  const isInspector = useMemo(() => {
    return session.user.roles.includes("Inspector");
  }, [session.user.roles]);

  const calculatedCompleteness = useMemo(() => {
    return computeProfileCompleteness({
      isInspector,
      kycStatus,
      emailVerified: verificationStatus.email,
      phoneVerified: verificationStatus.phone,
      licenseVerified,
      profileCompleteness,
    });
  }, [
    profileCompleteness,
    kycStatus,
    licenseVerified,
    verificationStatus.email,
    verificationStatus.phone,
    isInspector,
  ]);

  const pills: { id: TabType; label: string }[] = [
    { id: "general", label: "General Information" },
    { id: "address", label: "Address & Contact" },
    { id: "security", label: "Security" },
    ...(showPreferences ? [{ id: "preferences" as TabType, label: "Preferences" }] : []),
    ...(children ? [{ id: "docs" as TabType, label: "Professional Docs" }] : []),
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 3 }, pt: { xs: 2, md: 4 }, pb: 4 }}>
      {/* Top Row (Summary Section) */}
      <Grid container spacing={3} sx={{ alignItems: "stretch", mb: 3 }}>
        {/* Left item: Profile Avatar and Completion Card */}
        <Grid size={{ xs: 12, md: showVerification ? 6 : 12, sm: 6 }}>
          <ProfileCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <ProfileHeader
              userId={userId}
              accessToken={session.accessToken}
              photoUrl={profilePhotoUrl}
              firstName={firstName}
              lastName={lastName}
              email={email}
              completeness={calculatedCompleteness}
              isAdmin={session.user.roles.includes("Admin")}
            />
          </ProfileCard>
        </Grid>

        {/* Right item: VerificationStatus card */}
        {showVerification && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <ProfileCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <VerificationStatus
                emailVerified={verificationStatus.email}
                phoneVerified={verificationStatus.phone}
                licenseVerified={licenseVerified}
                licensePending={licensePending}
                kycStatus={kycStatus}
                isInspector={isInspector}
                onVerifyIdentity={() => {
                  setIdentityModalOpen(true);
                }}
                onUploadLicense={() => {
                  setLicenseModalOpen(true);
                }}
              />
            </ProfileCard>
          </Grid>
        )}
      </Grid>

      {/* Bottom Row (Settings Section) */}
      <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
        {/* Left Column: Navigation Pills, Preferences */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Navigation Pills Menu */}
            <Stack
              direction={{ xs: "row", md: "column" }}
              sx={{
                gap: 1,
                overflowX: "auto",
                whiteSpace: "nowrap",
                "&::-webkit-scrollbar": { display: "none" },
                pb: { xs: 1, md: 0 },
              }}
            >
              {pills.map(pill => (
                <Button
                  key={pill.id}
                  onClick={() => {
                    setActiveTab(pill.id);
                  }}
                  variant="text"
                  sx={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    py: 1.5,
                    px: 2.5,
                    borderRadius: 3,
                    width: { xs: "auto", md: "100%" },
                    flexShrink: 0,
                    fontWeight: activeTab === pill.id ? 700 : 500,
                    color: activeTab === pill.id ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: activeTab === pill.id ? theme.palette.border.light : "transparent",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor:
                        activeTab === pill.id ? theme.palette.border.light : theme.palette.sidebar.hoverBg,
                      color: activeTab === pill.id ? theme.palette.primary.main : theme.palette.text.primary,
                    },
                  }}
                >
                  {pill.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Grid>

        {/* Right Column: Active form content inside card wrapper */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Fade in={true} key={activeTab} timeout={300}>
            <Box>
              {activeTab === "general" && (
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.border.light}`,
                    boxShadow: theme.palette.shadow.card,
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                  }}
                >
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
                </Card>
              )}

              {activeTab === "address" && (
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.border.light}`,
                    boxShadow: theme.palette.shadow.card,
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                  }}
                >
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
                </Card>
              )}

              {activeTab === "security" && (
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.border.light}`,
                    boxShadow: theme.palette.shadow.card,
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <ChangePasswordForm userId={userId} accessToken={session.accessToken} />
                  </CardContent>
                </Card>
              )}

              {showPreferences && activeTab === "preferences" && (
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.border.light}`,
                    boxShadow: theme.palette.shadow.card,
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                  }}
                >
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
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
                  </CardContent>
                </Card>
              )}

              {activeTab === "docs" && children}
            </Box>
          </Fade>
        </Grid>
      </Grid>

      {showVerification && (
        <>
          <IdentityVerificationModal
            open={identityModalOpen}
            accessToken={session.accessToken}
            onClose={() => {
              setIdentityModalOpen(false);
            }}
            onSubmitted={next => {
              setVerification(next);
              setVerificationState("ready");
              setIdentityModalOpen(false);
            }}
          />

          <DriverLicenseModal
            open={licenseModalOpen}
            accessToken={session.accessToken}
            currentLicense={license}
            onClose={() => {
              setLicenseModalOpen(false);
            }}
            onSubmitted={next => {
              setLicense(next);
              setLicenseState("ready");
              setLicenseModalOpen(false);
            }}
          />
        </>
      )}
    </Box>
  );
}
