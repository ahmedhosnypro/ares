export interface VehicleImageItem {
  readonly id: string;
  readonly imageUrl: string;
  readonly isPrimary: boolean;
}

export interface VehicleFeatureItem {
  readonly id: string;
  readonly featureName: string;
  readonly featureDescription: string;
}

export interface VehicleDetailsViewModel {
  readonly vehicleId: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly licensePlate: string;
  readonly transmission: string;
  readonly fuelType: string;
  readonly seats: number;
  readonly pricePerDay: number;
  readonly locationCity: string;
  readonly description: string;
  readonly status: string;
  readonly availabilityStatus: string;
  readonly images: readonly VehicleImageItem[];
  readonly features: readonly VehicleFeatureItem[];
  readonly supplierId: string;
  readonly supplierName: string;
  readonly averageRating: number;
  readonly reviewCount: number;
}

export interface VehicleReviewViewModel {
  readonly reviewId: string;
  readonly userName: string;
  readonly rating: number;
  readonly comment: string;
  readonly supplierReply?: string;
  readonly repliedAt?: string;
  readonly createdAt: string;
}

export interface BookingLocationOption {
  readonly id: string;
  readonly label: string;
  readonly city: string;
}
