export interface BookingParty {
  readonly id?: string;
  readonly fullName?: string;
  readonly email?: string;
}

export interface BookingLocation {
  readonly id?: string;
  readonly name?: string;
}

export interface BookingCar {
  readonly id?: string;
  readonly name?: string;
  readonly image?: string;
  readonly supplier?: BookingParty;
}

export interface BookingInspectionOverview {
  readonly preInspectionStatus?: string;
  readonly postInspectionStatus?: string;
  readonly assignedInspectorId?: string;
  readonly assignedInspectorName?: string;
  readonly preInspectionDate?: string;
  readonly postInspectionDate?: string;
}

export interface AssignedDriverProfile {
  readonly driverProfileId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly profilePictureUrl?: string;
  readonly averageRating: number;
  readonly totalTrips: number;
}

export interface BookingDetails {
  readonly id?: string;
  readonly car?: BookingCar;
  readonly driver?: BookingParty;
  readonly pickupLocation?: BookingLocation;
  readonly dropOffLocation?: BookingLocation;
  readonly from?: string;
  readonly to?: string;
  readonly price?: number;
  readonly status?: string;
  readonly payLater?: boolean;
  readonly inspection?: BookingInspectionOverview;
  readonly driverFee?: number;
  readonly vehicleFee?: number;
  readonly grandTotal?: number;
  readonly withDriver?: boolean;
  readonly requiresDriver?: boolean;
  readonly assignedDriverProfile?: AssignedDriverProfile;
}
