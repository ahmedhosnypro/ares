"use client";

import dynamic from "next/dynamic";
import { Box } from "@mui/material";

const LeafletMap = dynamic(() => import("./DestinationMap"), {
  ssr: false,
  loading: () => (
    <Box 
      sx={{ 
        height: { xs: 400, md: 500 }, // Increased height for better discovery
        bgcolor: "grey.200", 
        borderRadius: 1.5, // Reduced from 4 (32px) to 1.5 (12px) for structured look
        overflow: "hidden",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}
    >
      Loading map...
    </Box>
  )
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
