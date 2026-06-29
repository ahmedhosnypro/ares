"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Box, Container, Grid, Typography, CircularProgress, Stack, Chip, Alert } from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import SentimentDissatisfiedOutlinedIcon from "@mui/icons-material/SentimentDissatisfiedOutlined";
import { getPublicOffers, type PublicOffer } from "@/api-clients/offers/offers";
import { logger } from "@/utils/logger";
import OfferCard from "./OfferCard";

export default function OffersPageContent() {
  const t = useTranslations("publicPages.offers");

  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const result = await getPublicOffers(1, 20);
        setOffers(result.data);
      } catch (err) {
        logger.error("Failed to load offers", err);
        setError(t("loadError"));
      } finally {
        setLoading(false);
      }
    }

    void loadOffers();
  }, []);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const offer of offers) {
      if (offer.categoryNames) {
        for (const name of offer.categoryNames) {
          categorySet.add(name);
        }
      }
    }
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (!activeCategory) return offers;
    return offers.filter(offer => offer.categoryNames?.includes(activeCategory) ?? false);
  }, [offers, activeCategory]);

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, minHeight: "80vh", bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        <Stack sx={{ alignItems: "center", mb: 8, gap: 2 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LocalOfferOutlinedIcon />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: "bold",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 600,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            {t("description")}
          </Typography>
        </Stack>

        {categories.length > 0 && (
          <Stack
            direction="row"
            sx={{
              gap: 1,
              mb: 4,
              overflowX: "auto",
              px: 0.5,
              py: 0.5,
              "&::-webkit-scrollbar": { height: "4px" },
            }}
          >
            <Chip
              label={t("allCategories")}
              color={activeCategory === null ? "primary" : "default"}
              variant={activeCategory === null ? "filled" : "outlined"}
              onClick={() => {
                setActiveCategory(null);
              }}
              sx={{ flexShrink: 0 }}
            />
            {categories.map(category => (
              <Chip
                key={category}
                label={category}
                color={activeCategory === category ? "primary" : "default"}
                variant={activeCategory === category ? "filled" : "outlined"}
                onClick={() => {
                  setActiveCategory(category);
                }}
                sx={{ flexShrink: 0 }}
              />
            ))}
          </Stack>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress color="primary" size={50} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <Alert severity="error" sx={{ maxWidth: 500 }}>
              {error}
            </Alert>
          </Box>
        ) : filteredOffers.length === 0 ? (
          <Stack sx={{ alignItems: "center", py: 10, gap: 2 }}>
            <SentimentDissatisfiedOutlinedIcon sx={{ fontSize: 64, color: "text.secondary" }} />
            <Typography variant="h6" sx={{ color: "text.secondary", textAlign: "center" }}>
              {t("emptyState")}
            </Typography>
          </Stack>
        ) : (
          <Grid container spacing={4}>
            {filteredOffers.map(offer => (
              <Grid key={offer.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <OfferCard offer={offer} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
