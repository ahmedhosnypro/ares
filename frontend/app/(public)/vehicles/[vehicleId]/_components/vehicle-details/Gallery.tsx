"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Box, ButtonBase, Stack } from "@mui/material";
import { toImageUrl } from "@/utils/image-url";
import type { VehicleImageItem } from "./types";

interface GalleryProps {
  readonly images: readonly VehicleImageItem[];
  readonly vehicleLabel: string;
}

export default function Gallery({ images, vehicleLabel }: GalleryProps) {
  const imageUrls = useMemo(
    () => images.map(image => toImageUrl(image.imageUrl)).filter((url): url is string => typeof url === "string"),
    [images]
  );

  const [activeImage, setActiveImage] = useState(imageUrls[0] ?? null);

  if (!activeImage) {
    return (
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 2,
          bgcolor: "action.hover",
        }}
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 2, overflow: "hidden" }}>
        <Image
          src={activeImage}
          alt={vehicleLabel}
          fill
          sizes="(max-width: 1200px) 100vw, 60vw"
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>

      {imageUrls.length > 1 ? (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", py: 0.5 }}>
          {imageUrls.map(url => {
            const isActive = url === activeImage;
            return (
              <ButtonBase
                key={url}
                onClick={() => {
                  setActiveImage(url);
                }}
                sx={{
                  position: "relative",
                  width: 120,
                  height: 76,
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: 1.5,
                  border: "2px solid",
                  borderColor: isActive ? "primary.main" : "transparent",
                  bgcolor: "action.hover",
                }}
              >
                <Image src={url} alt={vehicleLabel} fill sizes="120px" style={{ objectFit: "cover" }} />
              </ButtonBase>
            );
          })}
        </Box>
      ) : null}
    </Stack>
  );
}
