import type { CountriesLabels } from "../../../types/dashboard/admin/countries";

const countries: CountriesLabels = {
  title: "Countries",
  subtitle: "Manage available countries for locations",
  addCountry: "Add Country",
  stats: {
    totalCountries: "Total Countries",
    activeRegions: "Active Regions",
    activeRegionsDesc: "Approximation since countries are derived from active locations",
  },
  searchPlaceholder: "Search country by name...",
  table: {
    headers: {
      countryName: "Country Name",
      actions: "Actions",
    },
    empty: "No countries found",
    showing: "Showing <strong>{count}</strong> of {total} countries",
  },
  actions: {
    delete: "Delete Country",
  },
  deleteDialog: {
    title: "Delete Country",
    description: "Are you sure you want to delete this country?",
    notice: "This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete",
  },
  alerts: {
    deleteSuccess: "Country deleted successfully.",
    deleteError: "Failed to delete country.",
    checkError: "Failed to check country status.",
    cannotDelete: "This country cannot be deleted because it has locations.",
  },
};

export default countries;
