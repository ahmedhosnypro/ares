import { Box } from "@mui/material";
import VehicleCardSkeleton from "./VehicleCardSkeleton";

interface SearchResultsSkeletonProps {
  readonly count?: number;
}

export default function SearchResultsSkeleton({ count = 6 }: SearchResultsSkeletonProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <VehicleCardSkeleton key={index} />
      ))}
    </Box>
  );
}
