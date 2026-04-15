import re

with open('/workspace/frontend/app/page.tsx', 'r') as f:
    content = f.read()

# Make sure we don't import `dynamic` in page.tsx to avoid conflict with `export const dynamic = "force-dynamic"`

new_imports = """import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";

import DestinationMapWrapper from "./DestinationMapWrapper";
"""
if "DestinationMapWrapper" not in content:
    content = content.replace('import { toImageUrl }', new_imports + '\\nimport { toImageUrl }')

new_return = '''  // Add static vehicle classes for BookCars parity
  const vehicleClasses = [
    { title: "Compact & Mini", spec: "4 Seats, 2 Bags", img: "/img/mini.png", price: "$25" },
    { title: "Mid-Size & Standard", spec: "5 Seats, 3 Bags", img: "/img/midi.png", price: "$35" },
    { title: "SUVs & Maxi", spec: "5+ Seats, 4+ Bags", img: "/img/maxi.png", price: "$50" }
  ];

  const whyUs = [
    { title: "No hidden charges", icon: <CheckCircleRoundedIcon fontSize="large" color="primary" />, desc: "Pay exactly what you see." },
    { title: "Verified reviews", icon: <StarRoundedIcon fontSize="large" color="primary" />, desc: "Trust honest feedback." },
    { title: "Secure booking", icon: <ShieldRoundedIcon fontSize="large" color="primary" />, desc: "Your data is safe." },
    { title: "24/7 Support", icon: <SupportAgentRoundedIcon fontSize="large" color="primary" />, desc: "We're always here." },
  ];

  const services = [
    { title: "Seamless Fleet", icon: <DirectionsCarRoundedIcon /> },
    { title: "Flexible Plans", icon: <SettingsSuggestRoundedIcon /> },
    { title: "Best Prices", icon: <MapRoundedIcon /> },
    { title: "Online Booking", icon: <PublicRoundedIcon /> },
    { title: "Quality Assured", icon: <GppGoodRoundedIcon /> },
    { title: "Live Chat", icon: <ForumRoundedIcon /> },
  ];

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      {/* 1. Hero Section with Video Background */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: "60vh", md: "80vh" },
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          color: "common.white",
          textAlign: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.4)",
            zIndex: 1
          }
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "translate(-50%, -50%)",
            zIndex: 0
          }}
        >
          <source src="/cover.mp4" type="video/mp4" />
        </video>

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2, px: 3 }}>
          <Typography variant="h2" component="h1" fontWeight={800} sx={{ mb: 2, textShadow: "0 2px 10px rgba(0,0,0,0.5)", fontSize: { xs: "2.5rem", md: "4.5rem" } }}>
            {landingContent?.heroTitle ?? "Find the right car for your next adventure."}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, textShadow: "0 1px 5px rgba(0,0,0,0.5)", mb: 4, fontWeight: 400, fontSize: { xs: "1rem", md: "1.5rem" } }}>
            {landingContent?.heroDescription ?? "Compare top providers, see honest reviews, and book instantly."}
          </Typography>
        </Container>
      </Box>

      {/* 2. Floating Horizontal Search Strip */}
      <Container maxWidth="lg" sx={{ mt: { xs: -5, md: -6 }, position: "relative", zIndex: 5, mb: 8 }}>
        <Paper elevation={6} sx={{ p: 2, borderRadius: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, bgcolor: "background.paper" }}>
          <TextField
             fullWidth
             select
             label="Pickup location"
             defaultValue={defaultLocationId}
             sx={{ flex: { xs: "1 1 100%", md: "1 1 25%" } }}
          >
             {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                   {loc.name}
                </MenuItem>
             ))}
          </TextField>
          <TextField
             fullWidth
             type="date"
             label="Pickup date"
             defaultValue={defaultDates.pickupDate}
             InputLabelProps={{ shrink: true }}
             sx={{ flex: { xs: "1 1 100%", md: "1 1 15%" } }}
          />
          <TextField
             fullWidth
             type="date"
             label="Return date"
             defaultValue={defaultDates.returnDate}
             InputLabelProps={{ shrink: true }}
             sx={{ flex: { xs: "1 1 100%", md: "1 1 15%" } }}
          />
          <Button
             fullWidth
             variant="contained"
             color="warning"
             size="large"
             href={`/search?pickupLocation=${defaultLocationId}&pickupDate=${defaultDates.pickupDate}&returnDate=${defaultDates.returnDate}`}
             component={Link}
             sx={{ height: 56, flex: { xs: "1 1 100%", md: "1 1 20%" }, fontWeight: "bold", fontSize: "1.1rem" }}
          >
             Search cars
          </Button>
        </Paper>
      </Container>

      <Container maxWidth="xl" sx={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* 3. Vehicle Classes */}
        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>Choose your ride</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={5}>
            We have a wide range of vehicles to fit your needs.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 4 }}>
            {vehicleClasses.map((vc, i) => (
              <Card key={i} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4, textAlign: "center", overflow: "visible" }}>
                <Box sx={{ height: 160, position: "relative", mt: 4, mb: 1 }}>
                   <Image src={vc.img} alt={vc.title} fill style={{ objectFit: "contain" }} />
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">{vc.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{vc.spec}</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                     From {vc.price} / day
                  </Typography>
                  <Button variant="outlined" fullWidth component={Link} href={`/search?pickupLocation=${defaultLocationId}`}>Search Class</Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* 4. Why Us & Services */}
        <Box sx={{ bgcolor: "grey.50", py: 8, px: 4, mx: { xs: -2, md: -3 }, borderRadius: 6 }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={6}>Why choose us?</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 4, mb: 8 }}>
            {whyUs.map((wu, i) => (
              <Paper key={i} elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 4, bgcolor: "transparent" }}>
                <Box sx={{ display: "inline-flex", p: 2, borderRadius: "50%", bgcolor: "primary.light", color: "primary.main", mb: 2 }}>
                   {wu.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={1}>{wu.title}</Typography>
                <Typography variant="body2" color="text.secondary">{wu.desc}</Typography>
              </Paper>
            ))}
          </Box>
          <Divider sx={{ mb: 8 }} />
          <Typography variant="h5" fontWeight="bold" textAlign="center" mb={6}>Our Services</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 2 }}>
            {services.map((svc, i) => (
              <Paper key={i} elevation={1} sx={{ p: 3, textAlign: "center", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "primary.main", mt: 1 }}>{svc.icon}</Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>{svc.title}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* 5. Interactive Destinations Map */}
        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={2}>Destination Discovery</Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
            Find our premium fleet in hundreds of locations worldwide.
          </Typography>
          <DestinationMapWrapper locations={locations} />
        </Box>

        {/* 6. Customer Care Section */}
        <Paper elevation={0} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4, bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 6, overflow: "hidden" }}>
          <Box sx={{ p: { xs: 4, md: 8 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="h3" fontWeight="bold" mb={2}>We're here for you.</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>
              Our customer care team is available to assist you with every step of the rental process.
            </Typography>
            <Stack spacing={2} sx={{ mb: 4 }}>
              {["24/7 Phone Support", "Easy Online Cancellation", "Local Area Guides", "Dedicated Fleet Managers"].map((item, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CheckCircleRoundedIcon color="warning" />
                  <Typography variant="body1" fontWeight="bold">{item}</Typography>
                </Box>
              ))}
            </Stack>
            <Box>
              <Button variant="contained" color="warning" size="large" sx={{ fontWeight: "bold" }}>
                Contact Support
              </Button>
            </Box>
          </Box>
          <Box sx={{ minHeight: { xs: 300, md: "auto" }, bgcolor: "primary.light", display: "flex", alignItems: "center", justifyContent: "center", p: 4, position: "relative", overflow: "hidden" }}>
             <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "url('/img/map.jpg') center/cover", opacity: 0.4 }}></Box>
             <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 4, color: "text.primary", position: "relative", zIndex: 2, boxShadow: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>"The easiest rental I've ever booked."</Typography>
                <Typography variant="caption" color="text.secondary">— Sarah J., Verified Review</Typography>
             </Box>
          </Box>
        </Paper>

        <Divider />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>Frequently asked questions</Typography>
          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            {faqItems.map((item, idx) => (
              <Accordion key={idx} elevation={0} sx={{ "&:before": { display: "none" }, borderBottom: "1px solid", borderColor: "divider" }} TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0 }}>
                  <Typography fontWeight="bold">{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}'''

# Find the start of `return (` which is around line 100
pattern = r"return \(\n\s*<Box component=\"main\".*$"
result = re.sub(pattern, new_return, content, flags=re.DOTALL)

with open('/workspace/frontend/app/page.tsx', 'w') as f:
    f.write(result)
