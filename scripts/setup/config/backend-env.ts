/**
 * Backend Environment Configuration Module
 * Creates and manages backend/.env file
 */

import prompts from "prompts";
import { logInfo, logSuccess, logWarn, logDebug } from "../lib/logger";
import { fileExists, backupFile } from "../lib/utils";
import { generateJwtSecret } from "./secrets";

export interface BackendEnvConfig {
  // Database
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbIntegratedSecurity: boolean;
  dbUser: string;
  dbPassword: string;
  dbTrustServerCertificate: boolean;
  dbEncrypt: boolean;

  // JWT
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtExpirationMinutes: number;

  // CORS
  corsOrigins: string;

  // Logging
  logLevel: string;

  // Seeding
  seedDemoData: boolean;

  // Google OAuth
  googleClientId: string;
  googleClientSecret: string;

  // File Upload
  uploadPath: string;
  maxUploadSizeMb: number;

  // Email (optional)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

/**
 * Get default backend configuration
 */
export function getDefaultBackendConfig(isDevcontainer = false): BackendEnvConfig {
  return {
    // Database
    dbHost: isDevcontainer ? "mssql" : "localhost",
    dbPort: 1433,
    dbName: "AresCarRental",
    dbIntegratedSecurity: false,
    dbUser: "sa",
    dbPassword: "YourPassword123!",
    dbTrustServerCertificate: true,
    dbEncrypt: false,

    // JWT
    jwtSecret: generateJwtSecret(),
    jwtIssuer: "http://localhost:5000",
    jwtAudience: "http://localhost:3000",
    jwtExpirationMinutes: 60,

    // CORS
    corsOrigins: "http://localhost:3000",

    // Logging
    logLevel: "Information",

    // Seeding
    seedDemoData: true,

    // Google OAuth
    googleClientId: "YOUR_GOOGLE_CLIENT_ID",
    googleClientSecret: "",

    // File Upload
    uploadPath: "wwwroot/uploads",
    maxUploadSizeMb: 10,
  };
}

/**
 * Prompt user for backend configuration (interactive mode)
 * ALWAYS asks for every single value - no silent defaults
 */
export async function promptBackendConfig(
  defaults: BackendEnvConfig,
  isDevcontainer = false
): Promise<BackendEnvConfig> {
  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logInfo("Backend Configuration - Interactive Setup");
  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logInfo("");
  if (isDevcontainer) {
    logInfo("🐳 Detected: Running in devcontainer");
    logInfo("   SQL Server host should be 'mssql' (not localhost)");
  } else {
    logInfo("💻 Detected: Running locally");
    logInfo("   SQL Server host should be 'localhost'");
  }
  logInfo("");
  logInfo("You will be asked for EVERY configuration value.");
  logInfo("Press Enter to accept the default shown in [brackets]");
  logInfo("");

  const response = await prompts([
    {
      type: "text",
      name: "dbHost",
      message: "Database host",
      initial: defaults.dbHost,
    },
    {
      type: "number",
      name: "dbPort",
      message: "Database port (0 to skip)",
      initial: defaults.dbPort,
      min: 0,
      max: 65535,
    },
    {
      type: "text",
      name: "dbName",
      message: "Database name",
      initial: defaults.dbName,
    },
    {
      type: "confirm",
      name: "dbIntegratedSecurity",
      message: "Use Windows Authentication (Integrated Security)?",
      initial: defaults.dbIntegratedSecurity,
    },
    {
      type: (prev, values) => (values.dbIntegratedSecurity ? null : "text"),
      name: "dbUser",
      message: "Database user",
      initial: defaults.dbUser,
    },
    {
      type: (prev, values) => (values.dbIntegratedSecurity ? null : "password"),
      name: "dbPassword",
      message: "Database password",
      initial: defaults.dbPassword,
    },
    {
      type: "text",
      name: "jwtSecret",
      message: "JWT secret key (auto-generated, press Enter to use)",
      initial: defaults.jwtSecret,
    },
    {
      type: "text",
      name: "jwtIssuer",
      message: "JWT issuer (backend URL)",
      initial: defaults.jwtIssuer,
    },
    {
      type: "text",
      name: "jwtAudience",
      message: "JWT audience (frontend URL)",
      initial: defaults.jwtAudience,
    },
    {
      type: "number",
      name: "jwtExpirationMinutes",
      message: "JWT expiration (minutes)",
      initial: defaults.jwtExpirationMinutes,
    },
    {
      type: "text",
      name: "corsOrigins",
      message: "CORS allowed origins (comma-separated)",
      initial: defaults.corsOrigins,
    },
    {
      type: "select",
      name: "logLevel",
      message: "Logging level",
      choices: [
        { title: "Debug", value: "Debug" },
        { title: "Information", value: "Information" },
        { title: "Warning", value: "Warning" },
        { title: "Error", value: "Error" },
      ],
      initial: 1, // Information
    },
    {
      type: "confirm",
      name: "seedDemoData",
      message: "Seed demo data?",
      initial: defaults.seedDemoData,
    },
    {
      type: "confirm",
      name: "useGoogleAuth",
      message: "Configure Google Authentication?",
      initial: false,
    },
    {
      type: (prev) => (prev ? "text" : null),
      name: "googleClientId",
      message: "Google Client ID",
      initial: defaults.googleClientId,
    },
    {
      type: (prev, values) => (values.useGoogleAuth ? "password" : null),
      name: "googleClientSecret",
      message: "Google Client Secret",
    },
  ]);

  // Handle user cancellation (Ctrl+C)
  if (Object.keys(response).length === 0) {
    logWarn("Configuration cancelled by user");
    process.exit(0);
  }

  const config: BackendEnvConfig = {
    ...defaults,
    // Sanitize dbHost to ensure single backslashes for named instances
    dbHost: (response.dbHost as string).replace(/\\\\/g, "\\"),
    dbPort: response.dbPort as number,
    dbName: response.dbName as string,
    dbIntegratedSecurity: response.dbIntegratedSecurity as boolean,
    dbUser: response.dbUser as string,
    dbPassword: response.dbPassword as string,
    jwtSecret: response.jwtSecret as string,
    jwtIssuer: response.jwtIssuer as string,
    jwtAudience: response.jwtAudience as string,
    jwtExpirationMinutes: response.jwtExpirationMinutes as number,
    corsOrigins: response.corsOrigins as string,
    logLevel: response.logLevel as string,
    seedDemoData: response.seedDemoData as boolean,
    googleClientId: (response.googleClientId as string) || defaults.googleClientId,
    googleClientSecret: (response.googleClientSecret as string) || defaults.googleClientSecret,
  };

  return config;
}

/**
 * Build connection string from config
 */
export function buildConnectionString(config: BackendEnvConfig): string {
  const parts: string[] = [];

  // Named instances (containing a backslash) usually don't use a static port in the connection string
  // they resolve dynamically via SQL Browser
  const isNamedInstance = config.dbHost.includes("\\");

  if (config.dbPort > 0 && !isNamedInstance) {
    parts.push(`Server=${config.dbHost},${String(config.dbPort)}`);
  } else {
    parts.push(`Server=${config.dbHost}`);
  }

  parts.push(`Database=${config.dbName}`);

  if (config.dbIntegratedSecurity) {
    parts.push(`Integrated Security=True`);
  } else {
    parts.push(`User=${config.dbUser}`);
    parts.push(`Password=${config.dbPassword}`);
  }

  parts.push(`TrustServerCertificate=${config.dbTrustServerCertificate ? "True" : "False"}`);
  parts.push(`Encrypt=${config.dbEncrypt ? "True" : "False"}`);

  return parts.join(";");
}

/**
 * Generate backend .env file content
 */
export function generateBackendEnvContent(config: BackendEnvConfig): string {
  const connectionString = buildConnectionString(config);

  return `# Ares Car Rental - Backend Environment Configuration
# Generated: ${new Date().toISOString()}
# DO NOT commit this file to version control!

# ============================================
# Database Configuration
# ============================================
ConnectionStrings__DefaultConnection=${connectionString}

# ============================================
# JWT Configuration
# ============================================
Jwt__SecretKey=${config.jwtSecret}
Jwt__Issuer=${config.jwtIssuer}
Jwt__Audience=${config.jwtAudience}
Jwt__ExpirationMinutes=${String(config.jwtExpirationMinutes)}

# ============================================
# Google OAuth Configuration
# ============================================
# OAuth 2.0 Client ID from Google Cloud Console:
#   https://console.cloud.google.com/apis/credentials
# This MUST match the frontend's NEXT_PUBLIC_GOOGLE_CLIENT_ID.
Google__ClientId=${config.googleClientId}
GOOGLE_CLIENT_SECRET=${config.googleClientSecret}

# ============================================
# CORS Configuration
# ============================================
Cors__AllowedOrigins=${config.corsOrigins}

# ============================================
# Logging Configuration
# ============================================
Logging__LogLevel__Default=${config.logLevel}

# ============================================
# Application Settings
# ============================================
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000

# ============================================
# Seeding Configuration
# ============================================
SEED_DEMO_DATA=${String(config.seedDemoData)}

# ============================================
# File Upload Configuration
# ============================================
FileUpload__UploadPath=${config.uploadPath}
FileUpload__MaxFileSizeMB=${String(config.maxUploadSizeMb)}

# ============================================
# Email Configuration (Optional)
# ============================================
${config.smtpHost ? `Email__SmtpHost=${config.smtpHost}` : "# Email__SmtpHost=smtp.example.com"}
${config.smtpPort ? `Email__SmtpPort=${String(config.smtpPort)}` : "# Email__SmtpPort=587"}
${config.smtpUser ? `Email__SmtpUser=${config.smtpUser}` : "# Email__SmtpUser=user@example.com"}
${config.smtpPassword ? `Email__SmtpPassword=${config.smtpPassword}` : "# Email__SmtpPassword=password"}
${config.smtpFromEmail ? `Email__FromEmail=${config.smtpFromEmail}` : "# Email__FromEmail=noreply@ares.com"}
${config.smtpFromName ? `Email__FromName=${config.smtpFromName}` : "# Email__FromName=Ares Car Rental"}
`;
}


/**
 * Setup backend environment file
 */
export async function setupBackendEnv(quick = false, isDevcontainer = false): Promise<BackendEnvConfig> {
  const envPath = "backend/.env";
  const envExamplePath = "backend/.env.example";

  // Check if .env already exists
  if (await fileExists(envPath)) {
    logWarn(`Backend .env file already exists: ${envPath}`);

    if (!quick) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { shouldOverwrite } = await prompts({
        type: "confirm",
        name: "shouldOverwrite",
        message: "Overwrite existing .env file?",
        initial: false,
      });

      if (!shouldOverwrite) {
        logInfo("Keeping existing .env file");
        // Read and parse existing config (simplified - just return defaults)
        return getDefaultBackendConfig(isDevcontainer);
      }

      // Backup existing file
      await backupFile(envPath);
      logInfo("Backed up existing .env file");
    } else {
      // In quick mode, backup and overwrite
      await backupFile(envPath);
      logInfo("Backed up existing .env file");
    }
  }

  // Get configuration - ALWAYS prompt in non-quick mode
  const defaults = getDefaultBackendConfig(isDevcontainer);

  // In quick mode, use defaults silently
  // In interactive mode, ALWAYS ask user for every value
  const config = quick ? defaults : await promptBackendConfig(defaults, isDevcontainer);

  // Generate .env content
  const envContent = generateBackendEnvContent(config);

  // Write .env file
  await Bun.write(envPath, envContent);
  logSuccess(`Backend .env file created: ${envPath}`);

  // Set file permissions (Unix-like systems only)
  try {
    if (process.platform !== "win32") {
      await Bun.$`chmod 600 ${envPath}`.quiet();
      logDebug("Set .env file permissions to 600");
    }
  } catch (error) {
    logDebug(`Could not set file permissions: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Only update .env.example if it doesn't exist
  // This prevents unnecessary changes to the template file
  if (!(await fileExists(envExamplePath))) {
    logInfo("Creating .env.example template...");
    const exampleConfig = { ...config };
    // Replace sensitive values with placeholders
    exampleConfig.dbPassword = "YourStrongPassword123!";
    exampleConfig.jwtSecret = "your-super-secret-jwt-key-min-64-characters-long-change-this";
    if (exampleConfig.smtpPassword) {
      exampleConfig.smtpPassword = "your-smtp-password";
    }

    const exampleContent = generateBackendEnvContent(exampleConfig);
    await Bun.write(envExamplePath, exampleContent);
    logSuccess("Created .env.example");
  }

  return config;
}
