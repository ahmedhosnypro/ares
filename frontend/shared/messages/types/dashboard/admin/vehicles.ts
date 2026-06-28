export type AdminVehiclesLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly addBtn: string;
  readonly searchPlaceholder: string;
  readonly filters: {
    readonly allStatuses: string;
    readonly allCategories: string;
  };
  readonly table: {
    readonly makeModel: string;
    readonly licensePlate: string;
    readonly location: string;
    readonly priceDay: string;
    readonly status: string;
    readonly availability: string;
    readonly actions: string;
    readonly viewDetails: string;
    readonly editStatus: string;
    readonly delete: string;
    readonly noVehicles: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly message: string;
    readonly cancel: string;
    readonly confirm: string;
  };
  readonly alerts: {
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly statusSuccess: string;
    readonly statusError: string;
    readonly loadError: string;
    readonly signInToCreate: string;
    readonly signInToSave: string;
    readonly createVehicleIdError: string;
    readonly uploadImageError: string;
    readonly createSuccess: string;
    readonly updateSuccess: string;
  };
  readonly detailsTitle: string;
  readonly createTitle: string;
  readonly undoBtn: string;
  readonly redoBtn: string;
  readonly saveAllBtn: string;
  readonly createVehicleBtn: string;

  // New keys for fleet inventory dashboard
  readonly inventoryTitle: string;
  readonly inventorySubtitle: string;
  readonly bulkAssignBtn: string;
  readonly bulkAssignTitle: string;
  readonly bulkAssignDesc: string;
  readonly selectCategoryPlaceholder: string;
  readonly confirmBtn: string;
  readonly cancelBtn: string;
  readonly searchVehiclesPlaceholder: string;
  readonly categoryFilterLabel: string;
  readonly statusFilterLabel: string;
  readonly supplierFilterLabel: string;
  readonly transmissionFilterLabel: string;
  readonly sortByFilterLabel: string;
  readonly allCategoriesOpt: string;
  readonly allStatusesOpt: string;
  readonly allSuppliersOpt: string;
  readonly allTransmissionsOpt: string;
  readonly statusLabels: {
    readonly available: string;
    readonly booked: string;
    readonly maintenance: string;
    readonly unavailable: string;
    readonly retired: string;
    readonly fullyBooked: string;
  };
  readonly transmissions: {
    readonly automatic: string;
    readonly manual: string;
  };
  readonly sortOptions: {
    readonly newest: string;
    readonly oldest: string;
    readonly priceHigh: string;
    readonly priceLow: string;
  };
  readonly stats: {
    readonly totalAssets: string;
    readonly availableNow: string;
    readonly inMaintenance: string;
  };
  readonly showingCount: string;
  readonly emptyState: {
    readonly noMatchTitle: string;
    readonly noVehiclesTitle: string;
    readonly noMatchDesc: string;
    readonly noVehiclesDesc: string;
    readonly clearFiltersBtn: string;
  };
  readonly tableHeaders: {
    readonly vehicle: string;
    readonly category: string;
    readonly dailyRate: string;
    readonly supplier: string;
    readonly year: string;
    readonly transmission: string;
    readonly availability: string;
    readonly actions: string;
  };
  readonly tooltips: {
    readonly view: string;
    readonly edit: string;
    readonly delete: string;
    readonly cannotDeleteRented: string;
  };
  readonly errors: {
    readonly activeBookings: string;
    readonly cannotDeleteRented: string;
    readonly sessionExpired: string;
    readonly generic: string;
    readonly validationFailed: string;
  };
  readonly editor: {
    readonly vehicleIdentity: string;
    readonly make: string;
    readonly model: string;
    readonly year: string;
    readonly color: string;
    readonly licensePlate: string;
    readonly aboutVehicle: string;
    readonly description: string;
    readonly specifications: string;
    readonly transmission: string;
    readonly fuelType: string;
    readonly seats: string;
    readonly pricePerDay: string;
    readonly locationCity: string;
    readonly category: string;
    readonly includedFeatures: string;
    readonly addFeature: string;
    readonly featureName: string;
    readonly featureDescription: string;
    readonly carSettings: string;
    readonly availabilityStatus: string;
    readonly approvalStatus: string;
    readonly available: string;
    readonly unavailable: string;
    readonly pendingReview: string;
    readonly approvedActive: string;
    readonly rejected: string;
    readonly gasoline: string;
    readonly diesel: string;
    readonly electric: string;
    readonly hybrid: string;
    readonly automatic: string;
    readonly manual: string;
    readonly pluginHybrid: string;
  };
  readonly gallery: {
    readonly alt: string;
    readonly noImageSelected: string;
    readonly featuredImage: string;
    readonly setAsFeatured: string;
    readonly noPreview: string;
    readonly add: string;
    readonly fileSizeError: string;
  };
  readonly validation: {
    readonly makeRequired: string;
    readonly modelRequired: string;
    readonly yearWholeNumber: string;
    readonly yearMin: string;
    readonly yearMax: string;
    readonly colorRequired: string;
    readonly licensePlateRequired: string;
    readonly transmissionRequired: string;
    readonly fuelTypeRequired: string;
    readonly seatsMin: string;
    readonly seatsMax: string;
    readonly priceMin: string;
    readonly cityRequired: string;
    readonly categoryRequired: string;
  };
};
