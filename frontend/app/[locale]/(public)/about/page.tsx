import { Container, Typography } from "@mui/material";
import { apiFetchJson } from "@/utils/api-client";
import { AboutSections, type AboutSection } from "./_components/AboutSections";
import { getTranslations } from "next-intl/server";

async function getAboutSections(locale: string): Promise<AboutSection[]> {
  try {
    return await apiFetchJson<AboutSection[]>(`/api/about?locale=${locale}`);
  } catch {
    return [];
  }
}

export default async function AboutPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const sections = await getAboutSections(locale);
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const t = await getTranslations("publicPages.about");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {sorted.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 10 }}>
          {t("emptyState")}
        </Typography>
      ) : (
        <AboutSections sections={sorted} chipLabel={t("chipLabel")} browseVehiclesLabel={t("browseVehicles")} />
      )}
    </Container>
  );
}
