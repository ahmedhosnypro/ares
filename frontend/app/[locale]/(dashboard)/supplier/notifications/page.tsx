import { Box, Stack, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.supplierNotifications" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SupplierNotificationsPage() {
  const t = await getTranslations("dashboard.supplierNotifications");

  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 4, md: 5 } }}>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary">
          {t("placeholderDescription")}
        </Typography>
      </Stack>
    </Box>
  );
}
