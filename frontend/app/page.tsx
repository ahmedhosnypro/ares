import { Box, Container, Divider, Typography } from "@mui/material";
import HeroSection from "../components/features/HeroSection";
import SearchForm from "../components/forms/SearchForm";
import TrustIndicators from "../components/features/TrustIndicators";
import PopularDestinations from "../components/features/PopularDestinations";
import VehicleClassesSection from "../components/features/VehicleClassesSection";
import WhyChooseUsSection from "../components/features/WhyChooseUsSection";
import PartnerLogos from "../components/features/PartnerLogos";
import DestinationMapWrapper from "../components/features/DestinationMapWrapper";
import SupportSection from "../components/features/SupportSection";
import FAQSection from "../components/features/FAQSection";
import Footer from "../components/layout/Footer";
import {
  fetchLandingContent,
  fetchPublicLocations,
  formatDateInputValue,
} from "@/src/utils/public-data";

export const dynamic = "force-dynamic";

function getDefaultDates() {
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 1);

  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 4);

  return {
    pickupDate: formatDateInputValue(pickupDate),
    returnDate: formatDateInputValue(returnDate),
  };
}

export default async function Home() {
  const [locations, landingContent] = await Promise.all([
    fetchPublicLocations(),
    fetchLandingContent(),
  ]);

  const defaultDates = getDefaultDates();
  const defaultLocationId = locations[0]?.id ?? "";

  const faqItems = landingContent?.faqItems ?? [
    {
      question: "How do I book a rental car?",
      answer: "Simply select your pickup location, dates, and browse available vehicles. Click 'Reserve Now' on your chosen vehicle to complete the booking process.",
    },
    {
      question: "What documents do I need to pick up the car?",
      answer: "You'll need a valid driver's license, a credit card in your name, and your booking confirmation. International renters may need a passport and international driving permit.",
    },
    {
      question: "Can I cancel or modify my reservation?",
      answer: "Yes, you can cancel or modify your reservation through your account dashboard. Cancellation policies vary by supplier, so please review the terms during booking.",
    },
    {
      question: "Is insurance included in the rental price?",
      answer: "Basic insurance is typically included, but coverage levels vary. You can add additional protection during the booking process for extra peace of mind.",
    },
    {
      question: "What if I return the car late?",
      answer: "Late returns may incur additional charges based on the supplier's policy. We recommend contacting the rental location if you anticipate being late to discuss options.",
    },
  ];

  const heroTitle = landingContent?.heroTitle ?? "Find the right car for your next adventure.";
  const heroDescription =
    landingContent?.heroDescription ?? "Compare top providers, see honest reviews, and book instantly.";

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
      <TrustIndicators />

      {/* Popular destinations with visual cards */}
      <PopularDestinations />

      <Container maxWidth="xl" sx={{ display: "flex", flexDirection: "column", gap: 10, py: 10 }}>
        <VehicleClassesSection defaultLocationId={defaultLocationId} />

        <WhyChooseUsSection />

        {/* Partner/Brand logos for credibility */}
        <Box sx={{ mx: { xs: -2, md: -3 } }}>
          <PartnerLogos />
        </Box>

        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={2}>
            Destination Discovery
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
            Find our premium fleet in hundreds of locations worldwide.
          </Typography>
          <DestinationMapWrapper locations={locations} />
        </Box>

        <SupportSection />

        <Divider />

        <FAQSection faqItems={faqItems} />
      </Container>

      {/* Comprehensive footer */}
      <Footer />
    </Box>
  );
}
