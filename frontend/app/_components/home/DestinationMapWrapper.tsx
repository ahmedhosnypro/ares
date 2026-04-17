"use client";

import dynamic from "next/dynamic";
import { Box, Skeleton } from "@mui/material";

const LeafletMap = dynamic(() => import("./DestinationMap"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: { xs: 400, md: 500 },
        bgcolor: "grey.200",
        borderRadius: 1.5,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" sx={{ transform: "none" }} />
    </Box>
  ),
});

interface Location {
  id: string;
  city?: string;
  country?: string;
  governorate?: string;
  addressLine?: string;
}

export default function DestinationMapWrapper({ locations }: { readonly locations: readonly Location[] }) {
  return <LeafletMap locations={locations} />;
}
