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
}
