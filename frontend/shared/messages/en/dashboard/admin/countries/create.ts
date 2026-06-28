import type { CreateCountryLabels } from "../../../../types/dashboard/admin/countries/create";

const createCountry: CreateCountryLabels = {
  title: "Create New Country",
  backButtonTooltip: "Back to Countries",
  cardTitle: "Country Information",
  form: {
    fields: {
      nameEn: "Country Name (English)",
      nameAr: "Country Name (Arabic)",
      placeholderEn: "e.g., Egypt, United Arab Emirates, Saudi Arabia",
      placeholderAr: "مثال: مصر، الإمارات العربية المتحدة، المملكة العربية السعودية",
    },
    validation: {
      nameEnRequired: "Country name in English is required.",
      nameArRequired: "Country name in Arabic is required.",
      nameUniqueError: "Country name must be unique. This name is already in use.",
    },
    buttons: {
      cancel: "Cancel",
      submit: "Create Country",
      submitting: "Creating...",
    },
  },
  alerts: {
    success: "Country created successfully.",
    error: "Failed to create country. Please try again.",
  },
};

export default createCountry;
