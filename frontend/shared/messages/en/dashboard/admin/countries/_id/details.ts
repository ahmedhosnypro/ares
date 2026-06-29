import type { CountryDetailsLabels } from "../../../../../types/dashboard/admin/countries/_id/details";

const details: CountryDetailsLabels = {
  title: "Country Details",
  backButtonTooltip: "Back to Countries",
  cardTitle: "General Information",
  idLabel: "Country ID",
  nameLabel: "Country Name",
  actions: {
    edit: "Edit Country",
    delete: "Delete Country",
  },
  alerts: {
    loadFailed: "Failed to load country details.",
    notFound: "Country not found.",
    deleteSuccess: "Country deleted successfully.",
    deleteError: "Failed to delete country.",
    checkError: "Failed to verify country locations.",
    cannotDelete: "Cannot delete country. It has locations associated with it.",
  },
  deleteDialog: {
    title: "Delete Country",
    description: "Are you sure you want to delete this country? This action cannot be undone.",
    notice: "Note: You can only delete countries with zero associated locations.",
    cancel: "Cancel",
    confirm: "Delete",
  },
};

export default details;
