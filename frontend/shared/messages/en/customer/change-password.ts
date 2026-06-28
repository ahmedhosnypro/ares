import type { ChangePasswordLabels } from "../../types/customer/change-password";

const changePassword: ChangePasswordLabels = {
  title: "Change Password",
  signInRequired: {
    title: "Sign in required",
    message: "Please sign in to change your password.",
    signInButton: "Sign In",
  },
  currentPassword: "Current Password",
  newPassword: "New Password",
  confirmNewPassword: "Confirm New Password",
  toggleCurrentPasswordAria: "toggle current password visibility",
  toggleNewPasswordAria: "toggle new password visibility",
  toggleConfirmPasswordAria: "toggle confirm password visibility",
  changeButton: "Change Password",
  changing: "Changing...",
  changeSuccess: "Password changed successfully.",
  changeFailed: "Failed to change password.",
  passwordStrength: {
    tooShort: "Too short",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
  },
  validation: {
    currentPasswordRequired: "Current password is required",
    passwordMinLength: "Password must be at least 8 characters",
    passwordUppercase: "Must contain at least one uppercase letter",
    passwordLowercase: "Must contain at least one lowercase letter",
    passwordDigit: "Must contain at least one digit",
    passwordSpecialChar: "Must contain at least one special character",
    confirmPasswordRequired: "Please confirm your new password",
    passwordsDoNotMatch: "Passwords do not match",
  },
};

export default changePassword;
