export interface ProfileAddress {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface EmergencyContact {
  readonly name: string;
  readonly phone: string;
  readonly relationship: string;
}

export interface VerificationStatusData {
  readonly email: boolean;
  readonly phone: boolean;
  readonly driverLicense: boolean;
  readonly kyc: string;
}

export interface ProfileData {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly phone: string;
  readonly phoneVerified: boolean;
  readonly profileCompleteness: number;
  readonly profilePhotoUrl?: string;
  readonly address: ProfileAddress;
  readonly emergencyContact: EmergencyContact;
  readonly verificationStatus: VerificationStatusData;
  readonly dateOfBirth?: string;
  readonly languagePreference: string;
  readonly currencyPreference: string;
}
