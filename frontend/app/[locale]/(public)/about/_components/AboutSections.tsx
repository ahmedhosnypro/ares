"use client";

import { Box, Button, Card, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import CheckCircleOutlinedRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

export interface AboutSection {
  id: string;
  title: string;
  content: string;
  order: number;
  sectionType: string;
}

function HeroSection({ section }: Readonly<{ section: AboutSection }>) {
  const [headline, ...rest] = section.content.split("\n\n");
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        borderRadius: 2,
        p: { xs: 5, md: 8 },
        mb: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: theme =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.contrastText, 0.06)} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <Stack sx={{ alignItems: "flex-start", gap: 3, position: "relative" }}>
        <Chip
          icon={<DirectionsCarRoundedIcon />}
          label="About ARES"
          sx={{ bgcolor: "primary.contrastText", color: "primary.main", fontWeight: 700 }}
        />
        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {section.title}
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 640, fontWeight: 400, lineHeight: 1.7 }}>
          {headline}
        </Typography>
        {rest.length > 0 && (
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600, lineHeight: 1.8 }}>
            {rest.join("\n\n")}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function StorySection({ section }: Readonly<{ section: AboutSection }>) {
  const paragraphs = section.content.split("\n\n").filter(Boolean);
  return (
    <Box sx={{ mb: 6 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
        <Box
          sx={{
            width: { xs: "100%", md: 4 },
            minHeight: { xs: 4, md: "auto" },
            bgcolor: "primary.main",
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            {section.title}
          </Typography>
          <Stack spacing={2}>
            {paragraphs.map((p, i) => (
              <Typography key={i} variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {p}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function OfferSection({ section }: Readonly<{ section: AboutSection }>) {
  const items = section.content
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf(":");
      return idx > -1
        ? { label: line.substring(0, idx).trim(), desc: line.substring(idx + 1).trim() }
        : { label: line.trim(), desc: "" };
    });

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {section.title}
      </Typography>
      <Divider sx={{ mb: 4 }} />
      <Grid container spacing={2}>
        {items.map((item, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "none",
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <CheckCircleOutlinedRoundedIcon color="primary" sx={{ mt: 0.3, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {item.label}
                  </Typography>
                  {item.desc && (
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function StatsSection({ section }: Readonly<{ section: AboutSection }>) {
  const stats = section.content
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf(":");
      return idx > -1
        ? { label: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() }
        : { label: line.trim(), value: "" };
    });

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: { xs: 4, md: 6 },
        mb: 6,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, textAlign: "center" }}>
        {section.title}
      </Typography>
      <Grid container spacing={3} sx={{ justifyContent: "center" }}>
        {stats.map((stat, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack sx={{ alignItems: "center", gap: 0.5 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 800 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                {stat.label}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ValuesSection({ section }: Readonly<{ section: AboutSection }>) {
  const items = section.content
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf(":");
      return idx > -1
        ? { label: line.substring(0, idx).trim(), desc: line.substring(idx + 1).trim() }
        : { label: line.trim(), desc: "" };
    });

  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {section.title}
      </Typography>
      <Divider sx={{ mb: 4 }} />
      <Grid container spacing={2}>
        {items.map((item, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6 }}>
            <Card sx={{ p: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {item.label}
              </Typography>
              {item.desc && (
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function CtaSection({ section }: Readonly<{ section: AboutSection }>) {
  const [headline, ...rest] = section.content.split("\n\n");
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        borderRadius: 2,
        p: { xs: 5, md: 8 },
        textAlign: "center",
        mt: 2,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        {section.title}
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.9, mb: rest.length ? 1 : 4, lineHeight: 1.8 }}>
        {headline}
      </Typography>
      {rest.length > 0 && (
        <Typography variant="body2" sx={{ opacity: 0.75, mb: 4 }}>
          {rest.join(" ")}
        </Typography>
      )}
      <Button
        href="/search"
        variant="contained"
        size="large"
        sx={{
          bgcolor: "primary.contrastText",
          color: "primary.main",
          fontWeight: 700,
          px: 5,
          "&:hover": { bgcolor: "primary.contrastText", opacity: 0.9 },
        }}
      >
        Browse Vehicles
      </Button>
    </Box>
  );
}

function RenderSection({ section }: Readonly<{ section: AboutSection }>) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection section={section} />;
    case "story":
      return <StorySection section={section} />;
    case "offer":
      return <OfferSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "values":
      return <ValuesSection section={section} />;
    case "cta":
      return <CtaSection section={section} />;
    default:
      return <StorySection section={section} />;
  }
}

export function AboutSections({ sections }: Readonly<{ sections: AboutSection[] }>) {
  return (
    <>
      {sections.map(section => (
        <RenderSection key={section.id} section={section} />
      ))}
    </>
  );
}
