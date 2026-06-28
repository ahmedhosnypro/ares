export interface CreateSupplierVehicleLabels {
  title: string;
  errors: {
    notSignedIn: string;
    vehicleIdNotFound: string;
    unknownUpdateError: string;
    validationFailed: string;
  };
  toast: {
    created: string;
    updated: string;
  };
  fab: {
    undo: string;
    create: string;
    saveAll: string;
    redo: string;
  };
  gallery: {
    alt: string;
    noImageSelected: string;
    featuredImage: string;
    setAsFeatured: string;
    noPreview: string;
    add: string;
    fileSizeError: string;
  };
  sections: {
    vehicleIdentity: string;
    aboutVehicle: string;
    specifications: string;
    includedFeatures: string;
    carSettings: string;
  };
  fields: {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    description: string;
    transmission: string;
    fuelType: string;
    seats: string;
    pricePerDay: string;
    locationCity: string;
    category: string;
    availabilityStatus: string;
    approvalStatus: string;
    featureName: string;
    featureDescription: string;
  };
  dropdowns: {
    automatic: string;
    manual: string;
    gasoline: string;
    diesel: string;
    electric: string;
    hybrid: string;
    pluginHybrid: string;
    available: string;
    unavailable: string;
    pendingReview: string;
    approvedActive: string;
    rejected: string;
  };
  validation: {
    makeRequired: string;
    modelRequired: string;
    yearWholeNumber: string;
    yearMin: string;
    yearMax: string;
    colorRequired: string;
    licensePlateRequired: string;
    fuelTypeRequired: string;
    seatsMin: string;
    seatsMax: string;
    priceMin: string;
    cityRequired: string;
    categoryRequired: string;
    transmissionRequired: string;
  };
  features: {
    addFeature: string;
  };
}
