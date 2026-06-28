import type { GoogleSignInLabels } from "../../types/auth/google-signin";

const googleSignIn: GoogleSignInLabels = {
  defaultLabel: "Continue with Google",
  chooseRole: "Choose your role",
  roleDialogDescription:
    "Pick the role you want before continuing with Google. We'll use it only if this is your first time signing in.",
  cancel: "Cancel",
  confirmGoogle: "Continue with Google",
  roleCustomerLabel: "Customer",
  roleCustomerDesc: "Rent vehicles for personal or business trips.",
  roleSupplierLabel: "Supplier",
  roleSupplierDesc: "List and manage your fleet of rental vehicles.",
  roleDriverLabel: "Driver",
  roleDriverDesc: "Offer your driving services to customers.",
  noCredential: "Google did not return a credential. Please try again.",
  unexpectedError: "Unexpected error during Google sign-in",
  stillLoading: "Google sign-in is still loading. Please try again in a moment.",
  cancelled: "Google sign-in was cancelled or blocked by the browser. Please try again.",
  loadFailed: "Failed to load Google sign-in. Please check your connection.",
};

export default googleSignIn;
