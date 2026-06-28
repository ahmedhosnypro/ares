import { Link } from "@/shared/i18n/routing";
import { Box, Button, CardContent, Container, Paper, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";

export async function renderSignInRequired() {
  const t = await getTranslations("customer.bookingDetail");
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
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
        </Paper>
      </Container>
    </Box>
  );
}

export async function renderErrorState(title: string, message: string) {
  const t = await getTranslations("customer.bookingDetail");
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            border: "1px solid",
            borderColor: "border.main",
            bgcolor: "background.paper",
            boxShadow: "shadow.card",
          }}
        >
          <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
            <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {message}
            </Typography>
            <Link href="/bookings" style={{ textDecoration: "none" }}>
              <Button variant="outlined" size="large" sx={{ px: 4 }}>
                {t("overview.backToBookings")}
              </Button>
            </Link>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}
