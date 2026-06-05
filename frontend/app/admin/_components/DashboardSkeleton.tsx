import { Box, Grid, Skeleton, Card, CardContent } from "@mui/material";

export default function DashboardSkeleton() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Skeleton variant="text" width={300} height={60} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={200} height={30} sx={{ mb: 4 }} />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Skeleton variant="circular" width={52} height={52} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
