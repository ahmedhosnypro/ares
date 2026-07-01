import { Box, Container, Divider, Typography } from "@mui/material";
import HeroSection from "./_components/home/HeroSection";
import SearchForm from "./_components/home/SearchForm";
import TrustIndicators from "./_components/home/TrustIndicators";
import PopularDestinationsServer from "./_components/home/PopularDestinationsServer";
import VehicleClassesSection from "./_components/home/VehicleClassesSection";
import WhyChooseUsSection from "./_components/home/WhyChooseUsSection";
import PartnerLogos from "./_components/home/PartnerLogos";
import DestinationMapWrapper from "./_components/home/DestinationMapWrapper";
import SupportSection from "./_components/home/SupportSection";
import FAQSection from "./_components/home/FAQSection";
import Footer from "@/components/layout/Footer";
import {
  fetchPublicDestinations,
  fetchLandingContent,
  fetchPublicLocations,
  fetchPublicSuppliers,
} from "@/utils/public-data";
import { toApiDate } from "@/utils/dateTime";

export const dynamic = "force-dynamic";

function getDefaultDates() {
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 1);

  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 4);

  return {
    pickupDate: toApiDate(pickupDate),
    returnDate: toApiDate(returnDate),
  };
}

export default async function Home() {
  const [locations, landingContent, destinations, suppliers] = await Promise.all([
    fetchPublicLocations(),
    fetchLandingContent(),
    fetchPublicDestinations(4),
    fetchPublicSuppliers(8),
  ]);

  const defaultDates = getDefaultDates();
  const defaultLocationId = locations[0]?.id ?? "";

  const faqItems = landingContent?.faqItems ?? [
    {
      question: "How do I book a rental car?",
      answer:
        "Simply select your pickup location, dates, and browse available vehicles. Click 'Reserve Now' on your chosen vehicle to complete the booking process.",
    },
    {
      question: "What documents do I need to pick up the car?",
      answer:
        "You'll need a valid driver's license, a credit card in your name, and your booking confirmation. International renters may need a passport and international driving permit.",
    },
    {
      question: "Can I cancel or modify my reservation?",
      answer:
        "Yes, you can cancel or modify your reservation through your account dashboard. Cancellation policies vary by supplier, so please review the terms during booking.",
    },
    {
      question: "Is insurance included in the rental price?",
      answer:
        "Basic insurance is typically included, but coverage levels vary. You can add additional protection during the booking process for extra peace of mind.",
    },
    {
      question: "What if I return the car late?",
      answer:
        "Late returns may incur additional charges based on the supplier's policy. We recommend contacting the rental location if you anticipate being late to discuss options.",
    },
  ];

  const heroTitle = landingContent?.heroTitle ?? "Find the right car for your next adventure.";
  const heroDescription =
    landingContent?.heroDescription ?? "Compare top providers, see honest reviews, and book instantly.";
  const valueProps = landingContent?.valueProps ?? [];
  const support = landingContent?.support;

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <HeroSection heroTitle={heroTitle} heroDescription={heroDescription} />

      <SearchForm
        locations={locations}
        defaultLocationId={defaultLocationId}
        defaultPickupDate={defaultDates.pickupDate}
        defaultReturnDate={defaultDates.returnDate}
      />

      {/* Trust indicators immediately under search bar */}
      <TrustIndicators valueProps={valueProps} />

      {/* Popular destinations with visual cards - Server-side rendered */}
      <PopularDestinationsServer destinations={destinations} />

      <Container maxWidth="xl" sx={{ display: "flex", flexDirection: "column", gap: 10, py: 10 }}>
        <VehicleClassesSection defaultLocationId={defaultLocationId} />

        <WhyChooseUsSection />

        {/* Partner/Brand logos for credibility */}
        <Box sx={{ mx: { xs: -2, md: -3 } }}>
          <PartnerLogos suppliers={suppliers} />
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
            Destination Discovery
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
            Find our premium fleet in hundreds of locations worldwide.
          </Typography>
          <DestinationMapWrapper locations={locations} />
        </Box>

        <SupportSection support={support} />

        <Divider />

        <FAQSection faqItems={faqItems} />
      </Container>

      {/* Comprehensive footer */}
      <Footer />
    </Box>
  );
}
