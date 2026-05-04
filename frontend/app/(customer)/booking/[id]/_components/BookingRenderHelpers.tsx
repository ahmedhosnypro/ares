import Link from "next/link";
import { Box, Button, CardContent, Container, Paper, Typography } from "@mui/material";

export function renderSignInRequired() {
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
              Sign in required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Please sign in to view booking details.
            </Typography>
            <Link href="/sign-in" style={{ textDecoration: "none" }}>
              <Button variant="contained" size="large" sx={{ px: 4 }}>
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}

export function renderErrorState(title: string, message: string) {
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
                Back to Bookings
              </Button>
            </Link>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}
