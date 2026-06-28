import type { BankDetailsLabels } from "../../../types/dashboard/admin/bank-details";

const bankDetails: BankDetailsLabels = {
  title: "Bank Account Details",
  subtitle:
    "Manage the official bank accounts displayed to customers selecting offline or bank transfer payment methods.",
  form: {
    sectionTitle: "Bank Details Configuration",
    bankName: "Bank Name",
    accountHolder: "Account Holder Name",
    iban: "IBAN",
    swiftBic: "SWIFT / BIC",
    accountNumber: "Account Number",
    routingNumber: "Routing Number",
    notes: "Additional Instructions",
    saveButton: "Save Bank Details",
    saving: "Saving Changes...",
    reset: "Reset Form",
  },
  preview: {
    title: "Customer View Preview",
    description: "This is a preview of how the payment instructions will appear on the customer check-out page.",
    paymentMethod: "Bank Transfer (Pay Offline)",
    instruction:
      "Please transfer the total booking amount to the following bank account. Send your transfer receipt to verification to confirm your booking.",
    importantNotes: "Important Notes:",
  },
  alerts: {
    success: "Bank details saved and published successfully.",
    error: "Please correct the form fields before saving.",
    loading: "Saving details to server...",
    reset: "Form reset to published details.",
  },
  validation: {
    required: "This field is required.",
    invalidIban: "Invalid IBAN code format.",
    invalidSwift: "Invalid SWIFT/BIC code format.",
  },
};

export default bankDetails;
