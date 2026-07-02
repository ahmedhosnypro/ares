"use client";

import { Card, CardContent, Stack, Avatar, Box, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import DriverAvailabilityToggle from "../../_components/DriverAvailabilityToggle";

interface DashboardHeaderProps {
  readonly userName?: string;
  readonly initialAvailability: "Available" | "Unavailable" | "Reserved";
  readonly onAvailabilityChange?: (newAvailability: string) => void;
}

export default function DashboardHeader({ userName, initialAvailability, onAvailabilityChange }: DashboardHeaderProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.driverDashboard.dashboardHeader");

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.light",
        bgcolor: "overlay.blur",
        backdropFilter: "blur(20px)",
        boxShadow: theme.palette.shadow?.card || 1,
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap", // التعديل السحري: هينزل الزرار تحت لو الشاشة ضاقت
            alignItems: "center",
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          {/* الجزء الأيسر: معلومات السائق */}
          <Stack
            direction="row"
            spacing={3}
            sx={{
              alignItems: "center",
              flex: "1 1 300px", // بيدي مساحة مبدئية مرنة للنص
              minWidth: 0, // بيمنع النص إنه يكسر الكونتينر
            }}
          >
            <Avatar
              sx={{
                width: { xs: 60, sm: 72 },
                height: { xs: 60, sm: 72 },
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 700,
                fontSize: "1.5rem",
                flexShrink: 0, // بيمنع الأفاتار إنه يصغر أو يتبهدل
              }}
            >
              {userName?.[0] || t("defaultInitial")}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                {t("welcomeBack", { userName: userName || t("defaultUserName") })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("portalDescription")}
              </Typography>
            </Box>
          </Stack>

          {/* الجزء الأيمن: زر الحالة */}
          <Box
            sx={{
              bgcolor: "background.paper",
              px: 2.5,
              py: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "border.light",
              boxShadow: theme.palette.shadow?.card || 1,
              width: { xs: "100%", sm: "auto" }, // بياخد العرض كله في الموبايل
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DriverAvailabilityToggle
              initialAvailability={initialAvailability}
              onAvailabilityChange={onAvailabilityChange}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
