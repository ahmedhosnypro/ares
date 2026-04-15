export interface ProfileAddress {
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
}

export interface EmergencyContact {
  readonly name?: string;
  readonly phone?: string;
}

export interface VerificationStatusData {
  readonly email: boolean;
  readonly phone: boolean;
  readonly driverLicense: boolean;
  readonly kyc: "none" | "basic" | "standard" | "enhanced";
}

export interface ProfileData {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly profileCompleteness: number;
  readonly profilePhotoUrl?: string;
  readonly address?: ProfileAddress;
  readonly emergencyContact?: EmergencyContact;
  readonly verificationStatus: VerificationStatusData;
  readonly dateOfBirth?: string;
  readonly languagePreference?: string;
  readonly currencyPreference?: string;
}
