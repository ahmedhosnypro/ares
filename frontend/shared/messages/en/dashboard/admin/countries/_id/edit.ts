import type { EditCountryLabels } from "../../../../../types/dashboard/admin/countries/_id/edit";

const edit: EditCountryLabels = {
  title: "Edit Country",
  backButtonTooltip: "Back to Countries",
  cardTitle: "Country Localization Details",
  form: {
    fields: {
      nameEn: "Country Name (English)",
      nameAr: "Country Name (Arabic)",
      placeholderEn: "e.g., Egypt, Saudi Arabia",
      placeholderAr: "مثال: مصر، المملكة العربية السعودية",
    },
    validation: {
      nameEnRequired: "Country name in English is required.",
      nameArRequired: "Country name in Arabic is required.",
      nameUniqueError: "Country name must be unique. This name is already in use.",
    },
    buttons: {
      cancel: "Cancel",
      submit: "Save Changes",
      submitting: "Saving...",
    },
  },
  alerts: {
    loadFailed: "Failed to load country details.",
    notFound: "Country not found.",
    success: "Country updated successfully.",
    error: "Failed to update country.",
  },
};

export default edit;
