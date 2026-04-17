import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const urlSchema = z.string().url();

export const portSchema = z.number().int().min(1).max(65535);

export const jwtSecretSchema = z.string().min(32, "JWT secret must be at least 32 characters");

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const emailSchema = z.string().email();

export const connectionStringSchema = z
  .string()
  .regex(/Server=.+;Database=.+;User=.+;Password=.+/, "Invalid SQL Server connection string format");

export function validateUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function validatePort(port: number): boolean {
  return portSchema.safeParse(port).success;
}

export function validateJwtSecret(secret: string): boolean {
  return jwtSecretSchema.safeParse(secret).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validateConnectionString(connString: string): boolean {
  return connectionStringSchema.safeParse(connString).success;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBackendEnv(envContent: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const lines = envContent.split("\n");
  const env: Record<string, string> = {};

  // Parse env file
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join("=");
    }
  }

  // Check required keys
  const requiredKeys = [
    "ConnectionStrings__DefaultConnection",
    "Jwt__SecretKey",
    "Jwt__Issuer",
    "Jwt__Audience",
    "Jwt__ExpirationMinutes",
    "ASPNETCORE_ENVIRONMENT",
    "ASPNETCORE_URLS",
  ];

  for (const key of requiredKeys) {
    if (!env[key]) {
      result.errors.push(`Missing required key: ${key}`);
      result.valid = false;
    }
  }

  // Validate JWT secret
  if (env["Jwt__SecretKey"]) {
    if (!validateJwtSecret(env["Jwt__SecretKey"])) {
      result.errors.push("JWT secret must be at least 32 characters");
      result.valid = false;
    }
  }

  // Validate connection string
  if (env["ConnectionStrings__DefaultConnection"]) {
    if (!validateConnectionString(env["ConnectionStrings__DefaultConnection"])) {
      result.errors.push("Invalid connection string format");
      result.valid = false;
    }
  }

  // Validate URLs
  if (env["ASPNETCORE_URLS"]) {
    const urls = env["ASPNETCORE_URLS"].split(",");
    for (const url of urls) {
      if (!validateUrl(url.trim())) {
        result.errors.push(`Invalid URL in ASPNETCORE_URLS: ${url}`);
        result.valid = false;
      }
    }
  }

  return result;
}

export function validateFrontendEnv(envContent: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const lines = envContent.split("\n");
  const env: Record<string, string> = {};

  // Parse env file
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join("=");
    }
  }

  // Check required keys
  const requiredKeys = ["NEXT_PUBLIC_API_BASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"];

  for (const key of requiredKeys) {
    if (!env[key]) {
      result.errors.push(`Missing required key: ${key}`);
      result.valid = false;
    }
  }

  // Validate NextAuth secret
  if (env["NEXTAUTH_SECRET"]) {
    if (!validateJwtSecret(env["NEXTAUTH_SECRET"])) {
      result.errors.push("NextAuth secret must be at least 32 characters");
      result.valid = false;
    }

    if (env["NEXTAUTH_SECRET"].includes("your-secret") || env["NEXTAUTH_SECRET"].includes("GENERATE")) {
      result.warnings.push("NextAuth secret appears to be a default value. Generate a unique secret!");
    }
  }

  // Validate URLs
  if (env["NEXT_PUBLIC_API_BASE_URL"] && !validateUrl(env["NEXT_PUBLIC_API_BASE_URL"])) {
    result.errors.push("Invalid NEXT_PUBLIC_API_BASE_URL");
    result.valid = false;
  }

  if (env["NEXTAUTH_URL"] && !validateUrl(env["NEXTAUTH_URL"])) {
    result.errors.push("Invalid NEXTAUTH_URL");
    result.valid = false;
  }

  return result;
}
