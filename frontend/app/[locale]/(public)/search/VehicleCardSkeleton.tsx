"use client";

import { Box, Card, CardContent, Divider, Skeleton, Stack } from "@mui/material";

export default function VehicleCardSkeleton() {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "24px",
        boxShadow: "shadow.card",
        border: "1px solid",
        borderColor: "border.light",
      }}
    >
      {/* Image Skeleton */}
      <Box
        sx={{
          position: "relative",
          height: 240,
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        {/* Chip Skeleton */}
        <Skeleton
          variant="rounded"
          width={120}
          height={32}
          sx={{
            position: "absolute",
            left: 16,
            top: 16,
            borderRadius: "999px",
          }}
          animation="wave"
        />
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Title and Location */}
          <Box>
            <Skeleton variant="text" width="70%" height={32} animation="wave" />
            <Skeleton variant="text" width="40%" height={20} animation="wave" />
          </Box>

          {/* Price and Rating */}
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Skeleton variant="text" width={40} height={16} animation="wave" />
              <Skeleton variant="text" width={80} height={32} animation="wave" />
            </Box>
            <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
              <Skeleton variant="text" width={100} height={20} animation="wave" />
              <Skeleton variant="text" width={80} height={16} animation="wave" />
            </Stack>
          </Stack>

          <Divider />

          {/* Location and View Details */}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Skeleton variant="circular" width={30} height={30} animation="wave" />
              <Skeleton variant="text" width={100} height={20} animation="wave" />
            </Stack>
            <Skeleton variant="text" width={100} height={20} animation="wave" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
