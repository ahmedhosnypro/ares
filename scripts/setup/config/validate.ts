/**
 * Configuration Validation Module
 * Validates backend and frontend environment files
 */

import { z } from "zod";
import { logInfo, logSuccess, logWarn, logError, logDebug } from "../lib/logger";
import { fileExists } from "../lib/utils";
import { validateUrl, validateConnectionString, validateJwtSecret } from "../lib/validators";

// Backend .env validation schema
const backendEnvSchema = z.object({
  ConnectionStrings__DefaultConnection: z.string().min(1, "Connection string is required"),
  Jwt__SecretKey: z.string().min(32, "JWT secret must be at least 32 characters"),
  Jwt__Issuer: z.url(),
  Jwt__Audience: z.url(),
  Jwt__ExpirationMinutes: z.string().regex(/^\d+$/, "JWT expiration must be a number"),
  Cors__AllowedOrigins: z.string().min(1, "CORS origins are required"),
  Logging__LogLevel__Default: z.enum(["Debug", "Information", "Warning", "Error"]),
  ASPNETCORE_ENVIRONMENT: z.string().min(1),
  ASPNETCORE_URLS: z.string().min(1),
  SEED_DEMO_DATA: z.string().regex(/^(true|false)$/i, "SEED_DEMO_DATA must be true or false"),
  FileUpload__UploadPath: z.string().min(1),
  FileUpload__MaxFileSizeMB: z.string().regex(/^\d+$/, "Max file size must be a number"),
});

// Frontend .env.local validation schema
const frontendEnvSchema = z.object({
  NEXTAUTH_URL: z.url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_API_BASE_URL: z.url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, "App name is required"),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().regex(/^(true|false)$/i),
  NEXT_PUBLIC_ENABLE_DEBUG: z.string().regex(/^(true|false)$/i),
});

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse .env file into key-value pairs
 */
export async function parseEnvFile(filePath: string): Promise<Record<string, string>> {
  const content = await Bun.file(filePath).text();
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Parse key=value
    const match = /^([^=]+)=(.*)$/.exec(trimmed);
    if (match) {
      const key = match[1]?.trim();
      const value = match[2]?.trim();
      if (key && value !== undefined) {
        env[key] = value;
      }
    }
  }

  return env;
}

/**
 * Validate backend .env file
 */
export async function validateBackendEnv(): Promise<ValidationResult> {
  const filePath = "backend/.env";
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  logInfo("Validating backend .env file...");

  // Check if file exists
  if (!(await fileExists(filePath))) {
    result.valid = false;
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }

  try {
    // Parse .env file
    const env = await parseEnvFile(filePath);
    logDebug(`Parsed ${String(Object.keys(env).length)} environment variables`);

    // Validate with Zod schema
    const validation = backendEnvSchema.safeParse(env);

    if (!validation.success) {
      result.valid = false;
      for (const issue of validation.error.issues) {
        result.errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // Additional custom validations
    if (env.ConnectionStrings__DefaultConnection) {
      const connStringValid = validateConnectionString(env.ConnectionStrings__DefaultConnection);
      if (!connStringValid) {
        result.valid = false;
        result.errors.push("Invalid connection string format");
      }
    }

    if (env.Jwt__SecretKey) {
      const jwtValid = validateJwtSecret(env.Jwt__SecretKey);
      if (!jwtValid) {
        result.valid = false;
        result.errors.push("JWT secret must be at least 32 characters");
      }

      // Check for weak secrets
      const weakSecrets = ["secret", "password", "changeme", "default", "test", "example"];
      const lowerSecret = env.Jwt__SecretKey.toLowerCase();
      for (const weak of weakSecrets) {
        if (lowerSecret.includes(weak)) {
          result.warnings.push(`JWT secret contains weak pattern: "${weak}"`);
        }
      }
    }

    // Validate CORS origins
    if (env.Cors__AllowedOrigins) {
      const origins = env.Cors__AllowedOrigins.split(",").map(o => o.trim());
      for (const origin of origins) {
        const urlValid = validateUrl(origin);
        if (!urlValid) {
          result.warnings.push(`Invalid CORS origin: ${origin}`);
        }
      }
    }

    // Validate ASPNETCORE_URLS
    if (env.ASPNETCORE_URLS) {
      const urls = env.ASPNETCORE_URLS.split(";").map(u => u.trim());
      for (const url of urls) {
        const urlValid = validateUrl(url);
        if (!urlValid) {
          result.errors.push(`Invalid ASPNETCORE_URLS: ${url}`);
          result.valid = false;
        }
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Failed to parse .env file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
}

/**
 * Validate frontend .env.local file
 */
export async function validateFrontendEnv(): Promise<ValidationResult> {
  const filePath = "frontend/.env.local";
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  logInfo("Validating frontend .env.local file...");

  // Check if file exists
  if (!(await fileExists(filePath))) {
    result.valid = false;
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }

  try {
    // Parse .env.local file
    const env = await parseEnvFile(filePath);
    logDebug(`Parsed ${String(Object.keys(env).length)} environment variables`);

    // Validate with Zod schema
    const validation = frontendEnvSchema.safeParse(env);

    if (!validation.success) {
      result.valid = false;
      for (const issue of validation.error.issues) {
        result.errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // Check for weak NextAuth secret
    if (env.NEXTAUTH_SECRET) {
      const weakSecrets = ["secret", "password", "changeme", "default", "test", "example"];
      const lowerSecret = env.NEXTAUTH_SECRET.toLowerCase();
      for (const weak of weakSecrets) {
        if (lowerSecret.includes(weak)) {
          result.warnings.push(`NEXTAUTH_SECRET contains weak pattern: "${weak}"`);
        }
      }
    }

    // Check for default/example values
    if (env.NEXTAUTH_SECRET?.includes("your-nextauth-secret")) {
      result.warnings.push("NEXTAUTH_SECRET appears to be a default value");
    }

    // Validate API base URL matches backend
    if (env.NEXT_PUBLIC_API_BASE_URL) {
      const urlValid = validateUrl(env.NEXT_PUBLIC_API_BASE_URL);
      if (!urlValid) {
        result.errors.push(`Invalid API base URL: ${env.NEXT_PUBLIC_API_BASE_URL}`);
        result.valid = false;
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Failed to parse .env.local file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
}

/**
 * Validate all configuration files
 */
export async function validateAllConfigs(): Promise<boolean> {
  logInfo("Validating all configuration files...");
  logInfo("");

  let allValid = true;

  // Validate backend .env
  const backendResult = await validateBackendEnv();
  if (backendResult.valid) {
    logSuccess("Backend .env validation passed");
  } else {
    logError("Backend .env validation failed");
    allValid = false;
  }

  if (backendResult.errors.length > 0) {
    logError("Errors:");
    for (const error of backendResult.errors) {
      logError(`  - ${error}`);
    }
  }

  if (backendResult.warnings.length > 0) {
    logWarn("Warnings:");
    for (const warning of backendResult.warnings) {
      logWarn(`  - ${warning}`);
    }
  }

  logInfo("");

  // Validate frontend .env.local
  const frontendResult = await validateFrontendEnv();
  if (frontendResult.valid) {
    logSuccess("Frontend .env.local validation passed");
  } else {
    logError("Frontend .env.local validation failed");
    allValid = false;
  }

  if (frontendResult.errors.length > 0) {
    logError("Errors:");
    for (const error of frontendResult.errors) {
      logError(`  - ${error}`);
    }
  }

  if (frontendResult.warnings.length > 0) {
    logWarn("Warnings:");
    for (const warning of frontendResult.warnings) {
      logWarn(`  - ${warning}`);
    }
  }

  logInfo("");

  if (allValid) {
    logSuccess("All configuration files are valid!");
  } else {
    logError("Configuration validation failed. Please fix the errors above.");
  }

  return allValid;
}
