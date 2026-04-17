import { Box, Card, CardContent, Container, Skeleton, Stack } from "@mui/material";

export default function PopularDestinationsSkeleton() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "grey.50" }}>
      <Container maxWidth="xl">
        <Stack spacing={2} alignItems="center" mb={6}>
          <Skeleton variant="text" width={400} height={60} animation="wave" />
          <Skeleton variant="text" width={600} height={24} animation="wave" />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              sx={{
                height: "100%",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Skeleton variant="rectangular" height={200} animation="wave" />
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="80%" height={32} animation="wave" />
                <Skeleton variant="text" width="60%" height={20} animation="wave" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="50%" height={16} animation="wave" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Skeleton variant="rounded" width={250} height={48} animation="wave" sx={{ mx: "auto", borderRadius: 1.5 }} />
        </Box>
      </Container>
    </Box>
  );
}
