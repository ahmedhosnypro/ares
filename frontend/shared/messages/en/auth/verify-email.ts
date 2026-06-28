import type { VerifyEmailLabels } from "../../types/auth/verify-email";

const verifyEmail: VerifyEmailLabels = {
  loadingTitle: "Verifying your email...",
  loadingMessage: "Please wait a moment while we verify your account.",
  successTitle: "Email Verified!",
  successMessage: "Your email address has been successfully verified. You can now log in to your account.",
  continueToLogin: "Continue to Login",
  errorTitle: "Verification Failed",
  backToLogin: "Back to Login",
  registerNewAccount: "Register a new account",
  invalidLink: "Invalid verification link. Missing user ID or token.",
  verificationFailed: "Failed to verify email. The link may be expired or invalid.",
  unexpectedError: "An unexpected error occurred while communicating with the server.",
};

export default verifyEmail;
