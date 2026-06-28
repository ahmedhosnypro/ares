import type { CategoriesLabels } from "../../../types/dashboard/admin/categories";

const categories: CategoriesLabels = {
  title: "Categories",
  addCategory: "Add Category",
  editCategory: "Edit Category",
  table: {
    headers: {
      name: "Name",
      commission: "Commission",
      vehicles: "Vehicles",
      offer: "Offer",
      status: "Status",
      actions: "Actions",
    },
    empty: "No categories found.",
    offerNone: "None",
    offerValue: "{discount}% off",
    statusActive: "Active",
    statusInactive: "Inactive",
  },
  actions: {
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this category?",
  },
  alerts: {
    deleteSuccess: "Category deleted successfully.",
    deleteError: "Failed to delete category.",
    deleteHasVehiclesError: "Cannot delete a category that contains vehicles.",
    saveSuccess: "Category saved successfully.",
    loadError: "Failed to load categories. Please try again later.",
  },
  form: {
    addTitle: "Add Category",
    editTitle: "Edit Category",
    fields: {
      name: "Name",
      description: "Description",
      commission: "Commission Percentage",
      status: "Status",
      offerTitle: "Promotional Offer (Optional)",
      offerName: "Offer Name",
      discount: "Discount Percentage",
      startDate: "Start Date",
      endDate: "End Date",
      offerStatus: "Offer Status",
      offerActive: "Offer Active",
      offerInactive: "Offer Inactive",
    },
    validation: {
      nameRequired: "Name is required.",
    },
    errors: {
      saveFailed: "Failed to save category. Please try again.",
    },
  },
};

export default categories;
