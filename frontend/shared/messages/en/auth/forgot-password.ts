import type { ForgotPasswordLabels } from "../../types/auth/forgot-password";

const forgotPassword: ForgotPasswordLabels = {
  title: "Reset Password",
  subtitle: "Enter your email address and we'll send you a link to reset your password.",
  emailLabel: "Email Address",
  sendResetLink: "Send Reset Link",
  successTitle: "Check Your Email",
  successMessage: "If an account exists for {email}, we have sent a password reset link. Please check your inbox.",
  returnToSignIn: "Return to Sign In",
  rememberPassword: "Remember your password?",
  signInLink: "Sign in",
  errorTitle: "Error",
  resetFailed: "Failed to request password reset. Please try again.",
  unexpectedError: "An unexpected error occurred. Please try again later.",
  invalidEmail: "Invalid email",
  logoAlt: "Ares Logo",
  carImageAlt: "Luxury Car Interior",
  decorativeTitle: "Seamless Recovery",
  decorativeSubtitle:
    "Don't worry, getting back on the road is just a click away. Let's get you signed back in securely.",
};

export default forgotPassword;
