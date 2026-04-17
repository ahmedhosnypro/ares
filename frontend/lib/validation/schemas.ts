/**
 * Shared Zod schemas — single source of truth for all form validation.
 * These mirror the FluentValidation rules on the backend exactly.
 */
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// ── primitives ─────────────────────────────────────────────────────────────────

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine(v => isValidPhoneNumber(v), {
    message: "Enter a valid international phone number (e.g. +20 100 000 0000)",
  });

const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(v => !v || isValidPhoneNumber(v), {
    message: "Enter a valid international phone number",
  });

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/\d/, "Must contain at least one digit")
  .regex(/[\W_]/, "Must contain at least one special character");

// ── auth ───────────────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }).max(256, "Email must not exceed 256 characters"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name must not exceed 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must not exceed 100 characters"),
  email: z.email({ message: "Enter a valid email address" }).max(256, "Email must not exceed 256 characters"),
  password: passwordSchema,
  acceptedTerms: z.literal(true, {
    error: "You must accept the Terms of Service",
  }),
  acceptedPrivacy: z.literal(true, {
    error: "You must accept the Privacy Policy",
  }),
});

// ── profile ────────────────────────────────────────────────────────────────────

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name must not exceed 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must not exceed 100 characters"),
  phone: phoneSchema,
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      v => {
        if (!v) return true;
        const dob = new Date(v);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const hasBirthdayPassed =
          today.getMonth() > dob.getMonth() ||
          (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
        const actualAge = hasBirthdayPassed ? age : age - 1;
        return dob < today && actualAge >= 18 && actualAge <= 120;
      },
      { message: "You must be at least 18 years old and date must be in the past" }
    ),
});

export const addressSchema = z.object({
  street: z.string().max(200, "Street must not exceed 200 characters").optional().or(z.literal("")),
  city: z.string().max(100, "City must not exceed 100 characters").optional().or(z.literal("")),
  state: z.string().max(100, "State must not exceed 100 characters").optional().or(z.literal("")),
  postalCode: z
    .string()
    .max(20, "Postal code must not exceed 20 characters")
    .regex(/^[A-Za-z0-9\s-]{0,20}$/, "Postal code must contain only letters, numbers, spaces, and hyphens")
    .optional()
    .or(z.literal("")),
  country: z.string().max(100, "Country must not exceed 100 characters").optional().or(z.literal("")),
  emergencyName: z.string().max(200, "Name must not exceed 200 characters").optional().or(z.literal("")),
  emergencyPhone: optionalPhoneSchema,
  emergencyRelationship: z.string().max(50, "Relationship must not exceed 50 characters").optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── inferred types ─────────────────────────────────────────────────────────────

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
