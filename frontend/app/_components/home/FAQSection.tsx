"use client";

import { Accordion, AccordionDetails, AccordionSummary, Box, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FAQItem {
  readonly question: string;
  readonly answer: string;
}

interface FAQSectionProps {
  readonly faqItems: readonly FAQItem[];
}

export default function FAQSection({ faqItems }: FAQSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        mb={2}
        sx={{ fontSize: { xs: "1.75rem", md: "2.125rem" } }}
      >
        Frequently asked questions
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" mb={5} sx={{ maxWidth: 600, mx: "auto" }}>
        Find answers to common questions about our rental service.
      </Typography>

      {/* Unified container with consistent border radius */}
      <Paper
        elevation={0}
        sx={{
          maxWidth: 800,
          mx: "auto",
          borderRadius: 2, // Subtle 16px rounding
          overflow: "hidden", // Ensures children respect border radius
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {faqItems.map((item, idx) => (
          <Accordion
            key={idx}
            elevation={0}
            disableGutters
            sx={{
              "&:before": { display: "none" }, // Remove default MUI divider
              borderBottom: idx === faqItems.length - 1 ? "none" : "1px solid", // No border on last item
              borderColor: "divider",
              borderRadius: 0, // Remove individual item radius
              bgcolor: "transparent",
              // Fast, snappy animation timing
              "& .MuiAccordion-region": {
                // Use transform instead of height for better performance
              },
              "&.Mui-expanded": {
                margin: 0, // Remove default MUI expanded margin
              },
            }}
            slotProps={{
              transition: {
                timeout: 250, // Fast 250ms animation instead of default 1000ms+
                unmountOnExit: true,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 3,
                py: 2,
                minHeight: 64,
                "&:hover": {
                  bgcolor: "action.hover",
                },
                "& .MuiAccordionSummary-content": {
                  my: 1.5,
                },
                // Smooth icon rotation
                "& .MuiAccordionSummary-expandIconWrapper": {
                  transition: "transform 0.25s ease",
                },
                "&.Mui-expanded .MuiAccordionSummary-expandIconWrapper": {
                  transform: "rotate(180deg)",
                },
              }}
            >
              <Typography fontWeight="bold" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                px: 3,
                pb: 3,
                pt: 0,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.7,
                  fontSize: { xs: "0.875rem", md: "0.95rem" },
                }}
              >
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Optional: Add a help CTA below FAQs */}
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Still have questions?
        </Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{
            fontWeight: "bold",
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Contact our support team →
        </Typography>
      </Box>
    </Box>
  );
}
