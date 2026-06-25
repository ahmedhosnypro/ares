"use client";

import { Box, Container, Skeleton, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchResultsSkeleton from "./SearchResultsSkeleton";

export default function SearchLoading() {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        pb: 8,
        background: theme.palette.overlay.gradient,
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "border.main",
          bgcolor: "overlay.blur",
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={3}>
            <Box>
              <Skeleton variant="text" width={80} height={20} animation="wave" />
              <Skeleton variant="text" width="60%" height={60} animation="wave" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" height={24} animation="wave" sx={{ mt: 1 }} />
            </Box>

            {/* Search Form Skeleton */}
            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: "24px",
                boxShadow: theme.palette.shadow.card,
                border: `1px solid ${theme.palette.border.main}`,
                bgcolor: "background.paper",
              }}
            >
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "flex-end" }}>
                  <Skeleton variant="rounded" height={56} sx={{ flex: 2, borderRadius: "12px" }} animation="wave" />
                  <Skeleton variant="rounded" height={56} sx={{ flex: 1, borderRadius: "12px" }} animation="wave" />
                  <Skeleton variant="rounded" height={56} sx={{ flex: 1, borderRadius: "12px" }} animation="wave" />
                </Stack>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}
                >
                  <Skeleton variant="text" width={300} height={20} animation="wave" />
                  <Skeleton variant="rounded" width={220} height={48} sx={{ borderRadius: "999px" }} animation="wave" />
                </Stack>
              </Stack>
            </Box>

            {/* Chips Skeleton */}
            <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
              <Skeleton variant="rounded" width={150} height={32} sx={{ borderRadius: "16px" }} animation="wave" />
              <Skeleton variant="rounded" width={200} height={32} sx={{ borderRadius: "16px" }} animation="wave" />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <SearchResultsSkeleton count={6} />
      </Container>
    </Box>
  );
}
