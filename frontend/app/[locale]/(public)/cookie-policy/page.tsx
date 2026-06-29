import { Box, Container, Divider, Typography } from "@mui/material";
import { apiFetchJson } from "@/utils/api-client";
import { getTranslations } from "next-intl/server";

interface CookiePolicySection {
  id: string;
  title: string;
  content: string;
  order: number;
  updatedAt: string;
}

async function getCookiePolicySections(locale: string): Promise<CookiePolicySection[]> {
  try {
    return await apiFetchJson<CookiePolicySection[]>(`/api/cookie-policy?locale=${locale}`);
  } catch {
    return [];
  }
}

export default async function CookiePolicyPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const sections = await getCookiePolicySections(locale);
  const lastUpdated = sections[0]?.updatedAt
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(sections[0].updatedAt)
      )
    : null;
  const t = await getTranslations("publicPages.cookiePolicy");

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {t("title")}
        </Typography>
        {lastUpdated && (
          <Typography variant="body2" color="text.secondary">
            {t("lastUpdated")} {lastUpdated}
          </Typography>
        )}
      </Box>

      {sections.length === 0 ? (
        <Typography color="text.secondary">{t("emptyState")}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {sections.map((section, index) => (
            <Box key={section.id}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {index + 1}. {section.title}
              </Typography>
              {section.content.split("\n\n").map((paragraph, i) => (
                <Typography
                  key={i}
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 1.5, whiteSpace: "pre-line", lineHeight: 1.8 }}
                >
                  {paragraph}
                </Typography>
              ))}
              {index < sections.length - 1 && <Divider sx={{ mt: 4 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
}
