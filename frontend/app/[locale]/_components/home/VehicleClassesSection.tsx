"use client";

import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import { Box, Button, Card, CardContent, CardMedia, Divider, Grid, Typography, Link as MuiLink } from "@mui/material";
import { toImageUrl } from "@/utils/image-url";

interface VehicleClassesSectionProps {
  readonly defaultLocationId: string;
}

export default function VehicleClassesSection({ defaultLocationId }: VehicleClassesSectionProps) {
  const vehicleClasses = [
    {
      title: "Compact & Mini",
      spec: "4 Seats, 2 Bags",
      img: "/uploads/seed/mini.png",
      price: "$25",
      category: "Compact",
    },
    {
      title: "Mid-Size & Standard",
      spec: "5 Seats, 3 Bags",
      img: "/uploads/seed/midi.png",
      price: "$35",
      category: "Standard",
    },
    {
      title: "SUVs & Maxi",
      spec: "5+ Seats, 4+ Bags",
      img: "/uploads/seed/maxi.png",
      price: "$50",
      category: "Premium",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center", mb: 1 }}>
        Choose your ride
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 5 }}>
        We have a wide range of vehicles to fit your needs.
      </Typography>
      <Grid container spacing={4}>
        {vehicleClasses.map((vc, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2, // Reduced from 4 (32px) to 2 (16px) for more professional look
                textAlign: "center",
                overflow: "hidden", // Changed from "visible" to properly contain content
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardMedia
                sx={{
                  height: 200, // Increased height for better image display
                  position: "relative",
                  mt: 3,
                  mb: 2,
                  px: 3, // Add horizontal padding to prevent edge touching
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "action.hover", // Theme-aware background instead of hardcoded grey.50
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Image
                    src={toImageUrl(vc.img) || vc.img}
                    alt={vc.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{
                      objectFit: "contain", // Maintains aspect ratio without distortion
                      objectPosition: "center",
                    }}
                  />
                </Box>
              </CardMedia>
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  px: 3,
                  pb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  {vc.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {vc.spec}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h5" color="primary" sx={{ fontWeight: "bold", mb: 3 }}>
                  From {vc.price} / day
                </Typography>
                <Box sx={{ mt: "auto" }}>
                  {" "}
                  {/* Push button to bottom */}
                  <MuiLink
                    href={`/search?pickupLocationId=${defaultLocationId}&category=${vc.category}`}
                    component={Link}
                    underline="none"
                  >
                    <Button
                      variant="contained" // Changed from "outlined" to "contained" for primary action
                      color="primary"
                      fullWidth
                      sx={{
                        borderRadius: 1.5, // Subtle rounding (12px) instead of pill shape
                        py: 1.5, // Better vertical padding
                        fontWeight: "bold",
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      Search Class
                    </Button>
                  </MuiLink>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
