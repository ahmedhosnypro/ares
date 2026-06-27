export type ChangePasswordLabels = {
  readonly title: string;
  readonly signInRequired: {
    readonly title: string;
    readonly message: string;
    readonly signInButton: string;
  };
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmNewPassword: string;
  readonly toggleCurrentPasswordAria: string;
  readonly toggleNewPasswordAria: string;
  readonly toggleConfirmPasswordAria: string;
  readonly changeButton: string;
  readonly changing: string;
  readonly changeSuccess: string;
  readonly changeFailed: string;
  readonly passwordStrength: {
    readonly tooShort: string;
    readonly weak: string;
    readonly fair: string;
    readonly good: string;
    readonly strong: string;
  };
  readonly validation: {
    readonly currentPasswordRequired: string;
    readonly passwordMinLength: string;
    readonly passwordUppercase: string;
    readonly passwordLowercase: string;
    readonly passwordDigit: string;
    readonly passwordSpecialChar: string;
    readonly confirmPasswordRequired: string;
    readonly passwordsDoNotMatch: string;
  };
};
