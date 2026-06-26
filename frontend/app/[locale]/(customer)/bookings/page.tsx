import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Box, Button, CardContent, Container, Typography } from "@mui/material";
import { Link } from "@/shared/i18n/routing";
import BookingsList from "./_componets/BookingsList";
import { ResumeBookingBanner } from "@/app/[locale]/(customer)/booking/_components/ResumeBookingBanner";

export default async function MyBookingsPage() {
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
                Sign in required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Please sign in to view your bookings.
              </Typography>
              <Link href="/sign-in" style={{ textDecoration: "none" }}>
                <Button variant="contained" size="large" sx={{ px: 4 }}>
                  Sign In
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
            My Bookings
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
            }}
          >
            Track, manage, and review all your car rental reservations in one place.
          </Typography>
        </Box>

        <ResumeBookingBanner />

        <BookingsList userId={session.user.id} accessToken={session.accessToken} />
      </Container>
    </Box>
  );
}
