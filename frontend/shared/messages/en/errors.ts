import type { ErrorsLabels } from "../types/errors";

const errors: ErrorsLabels = {
  unauthorized: "Unauthorized access",
  notFound: "Resource not found",
  serverError: "Server error occurred",
  networkError: "Network connection error",
  validationError: "Validation error",
  requiredField: "This field is required",
  invalidEmail: "Invalid email address",
  passwordMismatch: "Passwords do not match",
  sessionExpired: "Session expired. Please log in again.",
  accessDenied: "Access denied",
};

export default errors;
