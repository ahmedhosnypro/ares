import type { CategoryDetailsLabels } from "../../../../types/dashboard/admin/categories/detail";

const categoryDetails: CategoryDetailsLabels = {
  backToCategories: "Back to Categories",
  statusActive: "Active",
  statusInactive: "Inactive",
  stats: {
    totalVehicles: "Total Vehicles",
    totalBookings: "Total Bookings",
    revenue: "Revenue",
  },
  vehiclesTable: {
    title: "Vehicles in Category",
    headers: {
      makeModel: "Make & Model",
      licensePlate: "License Plate",
      actions: "Actions",
    },
    viewButton: "View",
    empty: "No vehicles assigned to this category.",
  },
  promotions: {
    title: "Promotions",
    activeScheduled: "Active & Scheduled",
    addBtn: "Add",
    percentOff: "% OFF",
    deleteConfirm: "Are you sure you want to delete this promotion?",
    empty: "No promotions found.",
    alerts: {
      deleteSuccess: "Promotion deleted.",
      deleteError: "Failed to delete promotion.",
      saveSuccess: "Promotion saved successfully.",
      saveError: "Failed to save promotion.",
      loadError: "Failed to load promotions.",
      requiredFields: "Please fill out required fields correctly.",
      dateOrderError: "End date must be after start date.",
    },
    form: {
      addTitle: "Add Promotion",
      editTitle: "Edit Promotion",
      name: "Promotion Name",
      discount: "Discount",
      startDate: "Start Date",
      endDate: "End Date",
      status: "Status",
      statusOptions: {
        active: "Active",
        inactive: "Inactive",
        expired: "Expired",
      },
    },
  },
  errors: {
    notFound: "Category not found.",
    loadError: "Failed to load category details.",
  },
};

export default categoryDetails;
