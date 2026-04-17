import { Box, Container, Skeleton } from "@mui/material";
import PopularDestinationsSkeleton from "./_components/home/PopularDestinationsSkeleton";

export default function HomeLoading() {
  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section Skeleton */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "60vh", md: "80vh" },
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.300",
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2, px: 3 }}>
          <Skeleton variant="text" width="80%" height={80} animation="wave" sx={{ mx: "auto", mb: 2 }} />
          <Skeleton variant="text" width="60%" height={40} animation="wave" sx={{ mx: "auto" }} />
        </Container>
      </Box>

      {/* Search Form Skeleton */}
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: -5, md: -6 },
          position: "relative",
          zIndex: 5,
          mb: 8,
        }}
      >
        <Skeleton variant="rounded" height={120} animation="wave" sx={{ borderRadius: 2 }} />
      </Container>

      {/* Trust Indicators Skeleton */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ textAlign: "center" }}>
              <Skeleton variant="circular" width={60} height={60} animation="wave" sx={{ mx: "auto", mb: 2 }} />
              <Skeleton variant="text" width="60%" height={24} animation="wave" sx={{ mx: "auto" }} />
            </Box>
          ))}
        </Box>
      </Container>

      {/* Popular Destinations Skeleton */}
      <PopularDestinationsSkeleton />

      {/* Vehicle Classes Skeleton */}
      <Container maxWidth="xl" sx={{ py: 10 }}>
        <Skeleton variant="text" width={300} height={48} animation="wave" sx={{ mx: "auto", mb: 1 }} />
        <Skeleton variant="text" width={400} height={24} animation="wave" sx={{ mx: "auto", mb: 5 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={400} animation="wave" sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
