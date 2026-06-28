"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
  Chip,
  Stack,
  Grid,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import {
  Badge as BadgeIcon,
  DirectionsCar as DirectionsCarIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { useDateFnsLocale } from "@/hooks/useDateFnsLocale";
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

interface PayoutInfoDto {
  walletPhoneNumber: string;
  isWalletVerified: boolean;
}

function buildProfileData(
  profile: DriverProfileDetails,
  session: { user: { id: string } },
  t: (key: string) => string,
  currentLocale: string
): ProfileData {
  const addressParts = profile.address ? profile.address.split(",").map(p => p.trim()) : [];
  const mappedAddress = {
    street: addressParts[0] || "",
    city: addressParts[1] || "",
    state: addressParts[2] || "",
    postalCode: addressParts[3] || "",
    country: addressParts[4] || "",
  };
  const isVerified = profile.status === "Verified";

  return {
    userId: session.user.id || "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    emailVerified: isVerified,
    phone: profile.phoneNumber ?? "",
    phoneVerified: isVerified,
    profileCompleteness: isVerified ? 100 : profile.licenseNumber ? 80 : 40,
    profilePhotoUrl: profile.profilePictureUrl,
    address: mappedAddress,
    emergencyContact: {
      name: profile.emergencyContactName ?? "",
      phone: profile.emergencyContactPhone ?? "",
      relationship: t("emergencyContactRelationship"),
    },
    verificationStatus: {
      email: isVerified,
      phone: isVerified,
      driverLicense: isVerified,
      kyc: isVerified ? t("kycApproved") : t("kycPending"),
    },
    dateOfBirth: "",
    languagePreference: currentLocale,
    currencyPreference: "USD",
  };
}

export default function DriverProfileClient() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard.driverProfile");
  const tc = useTranslations("common");
  const { formatLocalized } = useDateFnsLocale();
  const currentLocale = useLocale();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfileDetails | null>(null);
  const [error, setError] = useState("");

  const [payoutInfo, setPayoutInfo] = useState<PayoutInfoDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [walletPhone, setWalletPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPayoutInfo = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(toApiUrl("/api/driver/profile/payout-info"), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as PayoutInfoDto;
        setPayoutInfo(data);
      }
    } catch (err) {
      logger.error("Error fetching payout info", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(toApiUrl("/api/driver/profile/me"), {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error(t("failedToLoadProfile"));

        const data = (await res.json()) as unknown as DriverProfileDetails;
        setProfile(data);
      } catch (err) {
        logger.error("Error fetching driver profile", err);
        setError(t("couldNotLoadProfileDetails"));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, [session, t]);

  useEffect(() => {
    void fetchPayoutInfo();
  }, [fetchPayoutInfo]);

  const handleOpenEditDialog = () => {
    setWalletPhone(payoutInfo?.walletPhoneNumber ?? "");
    setEditDialogOpen(true);
  };

  const handleSavePayoutInfo = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      const res = await fetch(toApiUrl("/api/driver/profile/payout-info"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletPhoneNumber: walletPhone }),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        await fetchPayoutInfo();
      }
    } catch (err) {
      logger.error("Error saving payout info", err);
    } finally {
      setSaving(false);
    }
  };

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
        <Alert severity="error">{error || t("profileNotFound")}</Alert>
      </Container>
    );
  }

  const profileData = buildProfileData(profile, session, t, currentLocale);

  return (
    <SharedProfileContainer session={session} profileData={profileData} showVerification={true} showPreferences={false}>
      <ProfileCard>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <BadgeIcon color="primary" /> {t("licenseDetails")}
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", fontWeight: 700 }}
                  >
                    {t("licenseNumber")}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {profile.licenseNumber || tc("na")}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", fontWeight: 700 }}
                  >
                    {t("expiryDate")}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {profile.licenseExpiryDate
                      ? formatLocalized(new Date(profile.licenseExpiryDate), "MMMM d, yyyy")
                      : tc("na")}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <DirectionsCarIcon color="primary" /> {t("approvedWorkAreas")}
              </Typography>
              {profile.workAreas.length === 0 ? (
                <Typography color="text.secondary">{t("noWorkAreasAssigned")}</Typography>
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

      <ProfileCard>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWalletIcon color="primary" /> {t("payoutInfo")}
            </Typography>
            <Button variant="outlined" size="small" onClick={handleOpenEditDialog}>
              {payoutInfo ? t("editPayoutInfo") : t("setupPayoutInfo")}
            </Button>
          </Stack>

          {payoutInfo ? (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  {t("walletPhoneNumber")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {payoutInfo.walletPhoneNumber}
                </Typography>
                {payoutInfo.isWalletVerified ? (
                  <Chip
                    label={t("verified")}
                    size="small"
                    sx={{
                      bgcolor: "status.active.main",
                      color: "status.active.contrastText",
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Chip
                    label={t("pendingVerification")}
                    size="small"
                    sx={{
                      bgcolor: "status.pending.main",
                      color: "status.pending.contrastText",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {payoutInfo.isWalletVerified ? t("walletSetupComplete") : t("walletNeedsVerification")}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">{t("payoutInfoDescription")}</Typography>
          )}
        </CardContent>
      </ProfileCard>

      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{payoutInfo ? t("editPayoutInfo") : t("setupPayoutInfo")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("walletPhoneNumber")}
            placeholder={t("walletPhonePlaceholder")}
            value={walletPhone}
            onChange={e => {
              setWalletPhone(e.target.value);
            }}
            margin="normal"
            slotProps={{ htmlInput: { autoComplete: "off" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
            }}
          >
            {tc("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSavePayoutInfo();
            }}
            disabled={saving || !walletPhone.trim()}
          >
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </SharedProfileContainer>
  );
}
