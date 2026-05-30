import { Container, Typography } from "@mui/material";
import { apiFetchJson } from "@/utils/api-client";
import { AboutSections, type AboutSection } from "./_components/AboutSections";

async function getAboutSections(): Promise<AboutSection[]> {
  try {
    return await apiFetchJson<AboutSection[]>("/api/about");
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const sections = await getAboutSections();
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {sorted.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 10 }}>
          About page content is not available at this time.
        </Typography>
      ) : (
        <AboutSections sections={sorted} />
      )}
    </Container>
  );
}
