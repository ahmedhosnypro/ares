import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Box, Button, CardContent, Container, Typography } from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import BookingsList from "./_componets/BookingsList";
import { ResumeBookingBanner } from "@/app/[locale]/(customer)/booking/_components/ResumeBookingBanner";
import { getTranslations } from "next-intl/server";

export default async function MyBookingsPage() {
  const t = await getTranslations("customer.bookings");
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id || !session.accessToken) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "border.main",
              bgcolor: "background.paper",
              boxShadow: "shadow.card",
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
              <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
                {t("signInRequired.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t("signInRequired.message")}
              </Typography>
              <Link href="/sign-in" style={{ textDecoration: "none" }}>
                <Button variant="contained" size="large" sx={{ px: 4 }}>
                  {t("signInRequired.signInButton")}
                </Button>
              </Link>
            </CardContent>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        {/* Page header */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography
            variant="h4"
            color="text.primary"
            gutterBottom
            sx={{
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem", lg: "2.5rem" },
              fontWeight: 800,
            }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
            }}
          >
            {t("description")}
          </Typography>
        </Box>

        <ResumeBookingBanner />

        <BookingsList userId={session.user.id} accessToken={session.accessToken} />
      </Container>
    </Box>
  );
}
