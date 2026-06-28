import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { type ProfileData } from "./types";
import { logger } from "@/utils/logger";
import SharedProfileContainer from "@/components/profile/SharedProfileContainer";
import ProfileCard from "@/components/profile/ProfileCard";
import { Alert, Box, Button, CardContent, Container, Typography } from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("customer.accountProfile");
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id || !session.accessToken) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <ProfileCard>
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
              <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
                {t("signInRequired.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t("signInRequired.message")}
              </Typography>
              <Link href="/sign-in" style={{ textDecoration: "none" }}>
                <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                  {t("signInRequired.signInButton")}
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
        errorMessage = t("profile.error.signInAgain");
      } else if (response.status === 404) {
        errorType = "notfound";
        errorMessage = t("profile.error.message");
      } else if (response.status >= 500) {
        errorType = "server";
        errorMessage = t("profile.error.message");
      } else {
        errorType = "unknown";
        errorMessage = t("profile.error.message");
      }
    }
  } catch (error) {
    logger.error("Profile fetch error", { error });
    errorType = "network";
    errorMessage = t("profile.error.message");
  }

  if (!profileData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <ProfileCard>
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
              <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                {errorMessage ?? t("profile.error.message")}
              </Alert>
              {errorType === "auth" ? (
                <Link href="/sign-in" style={{ textDecoration: "none" }}>
                  <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                    {t("profile.error.signInAgain")}
                  </Button>
                </Link>
              ) : (
                <Link href="/account/profile" style={{ textDecoration: "none" }}>
                  <Button variant="contained" color="primary" size="large" sx={{ px: 4, fontWeight: 700 }}>
                    {t("profile.error.tryAgain")}
                  </Button>
                </Link>
              )}
            </CardContent>
          </ProfileCard>
        </Container>
      </Box>
    );
  }

  const isAdmin = session.user.roles.includes("Admin");

  return (
    <SharedProfileContainer
      session={session}
      profileData={profileData}
      showVerification={!isAdmin}
      showPreferences={true}
    />
  );
}
