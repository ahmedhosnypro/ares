import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ProfileCard from "@/components/profile/ProfileCard";
import { CardContent } from "@mui/material";
import { getTranslations } from "next-intl/server";

export default async function ChangePasswordPage() {
  const t = await getTranslations("customer.changePassword");
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="sm">
        <ChangePasswordForm userId={session.user.id} accessToken={session.accessToken} />
      </Container>
    </Box>
  );
}
