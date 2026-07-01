"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";
import { Box, Card, Typography, Stack, Chip, Button } from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { Link } from "@/shared/i18n/routing";
import type { PublicOffer } from "@/api-clients/offers/offers";

interface OfferCardProps {
  readonly offer: PublicOffer;
}

function getDiscountLabel(
  offer: PublicOffer,
  t: (key: string, params?: Record<string, string | number | Date>) => string
): string {
  if (offer.discountType === "percentage") {
    return t("discountBadgePercent", { value: offer.discountValue });
  }
  return t("discountBadgeFixed", { value: offer.discountValue });
}

function formatDate(dateString: string, locale: string): string {
  return formatUtcDate(dateString, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OfferCard({ offer }: OfferCardProps) {
  const t = useTranslations("publicPages.offers");
  const locale = useLocale();

  const discountLabel = getDiscountLabel(offer, t);
  const formattedFrom = formatDate(offer.validFrom, locale);
  const formattedTo = formatDate(offer.validTo, locale);

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "border.light",
        boxShadow: theme => theme.palette.shadow.card,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          boxShadow: theme => theme.palette.shadow.cardHover,
          transform: "translateY(-4px)",
        },
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "success.main",
              color: "success.contrastText",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <LocalOfferOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {discountLabel}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
          {offer.description}
        </Typography>

        {offer.categoryNames && offer.categoryNames.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {offer.categoryNames.map(name => (
              <Chip
                key={name}
                label={name}
                size="small"
                variant="outlined"
                sx={{ borderColor: "border.light", color: "text.secondary" }}
              />
            ))}
          </Stack>
        )}

        <Box sx={{ flex: 1 }} />

        {offer.isAutomatic ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "success.main",
              color: "success.contrastText",
            }}
          >
            <BoltOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("automaticDiscount")}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px dashed",
              borderColor: "border.main",
            }}
          >
            <ContentCopyOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              {t("codeLabel", { code: offer.code })}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "text.secondary",
          }}
        >
          <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {t("validFromTo", { from: formattedFrom, to: formattedTo })}
          </Typography>
        </Box>

        {(offer.minimumDurationHours != null || offer.minimumValue != null) && (
          <Stack sx={{ gap: 0.5 }}>
            {offer.minimumDurationHours != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("minimumDuration", { hours: offer.minimumDurationHours })}
                </Typography>
              </Box>
            )}
            {offer.minimumValue != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("minimumBooking", { value: offer.minimumValue })}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        <Button variant="contained" component={Link} href="/search" fullWidth sx={{ mt: 1 }}>
          {t("browseVehicles")}
        </Button>
      </Box>
    </Card>
  );
}
