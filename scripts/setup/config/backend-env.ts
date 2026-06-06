/**
 * Backend Environment Configuration Module
 * Creates and manages backend/.env file
 */

import { logInfo, logSuccess, logWarn, logDebug } from "../lib/logger";
import { fileExists, backupFile, parseEnv, prompts } from "../lib/utils";
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

  // Paymob Payment Gateway
  paymobApiKey: string;
  paymobIntegrationId: string;
  paymobIframeId: string;
  paymobHmacSecret: string;
  paymobBaseUrl: string;
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

    // Paymob Payment Gateway
    paymobApiKey: "",
    paymobIntegrationId: "",
    paymobIframeId: "",
    paymobHmacSecret: "",
    paymobBaseUrl: "https://accept.paymob.com",
  };
}

/**
 * Prompt user for a configuration value, offering choices if an existing value is present
 */
async function promptValue<T extends string | number | boolean>(
  message: string,
  defaultValue: T,
  existingValue?: string,
  type: "text" | "number" | "confirm" | "password" = "text",
  allowEmpty = false
): Promise<T> {
  const isValueEmpty = existingValue === undefined || existingValue.trim() === "";

  // If no existing value or (it's empty AND we don't explicitly allow empty), use standard prompt
  if (isValueEmpty && !allowEmpty) {
    const response = await prompts({
      type,
      name: "value",
      message,
      initial: defaultValue,
    });
    
    return response.value as T;
  }

  // Handle case where it was in the record but actually undefined
  const displayValue = existingValue === undefined || existingValue.trim() === "" ? "(Empty/None)" : existingValue;

  // Three-way choice: Existing, Default, or New
  const choiceResponse = await prompts({
    type: "select",
    name: "action",
    message: message,
    choices: [
      { 
        title: `Use Existing: ${displayValue}`, 
        description: existingValue === String(defaultValue) ? "(Same as default)" : "",
        value: "existing" 
      },
      { title: `Use Default:  ${String(defaultValue)}`, value: "default" },
      { title: "Enter New Value...", value: "new" },
    ],
    initial: 0
  });

  if (choiceResponse.action === "existing") {
    if (existingValue === undefined || existingValue.trim() === "") {
      if (typeof defaultValue === "number") return 0 as unknown as T;
      if (typeof defaultValue === "boolean") return false as unknown as T;
      return "" as unknown as T;
    }
    if (typeof defaultValue === "number") return Number.parseInt(existingValue, 10) as unknown as T;
    if (typeof defaultValue === "boolean") return (existingValue.toLowerCase() === "true") as unknown as T;
    return existingValue as unknown as T;
  }
  
  if (choiceResponse.action === "default") {
    return defaultValue;
  }

  // Manual entry for new value
  const newResponse = await prompts({
    type,
    name: "value",
    message: `Enter new value for ${message.toLowerCase()}:`,
    initial: defaultValue,
  });

  return newResponse.value as T;
}

/**
 * Prompt user for backend configuration (interactive mode)
 */
export async function promptBackendConfig(
  defaults: BackendEnvConfig,
  _isDevcontainer = false,
  existingEnv: Record<string, string> = {}
): Promise<BackendEnvConfig> {
  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logInfo("Backend Configuration - Interactive Setup");
  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logInfo("");

  // Helper to get existing value by key
  const getExisting = (key: string) => existingEnv[key];
  
  // Robust connection string parsing
  const connString = getExisting("ConnectionStrings__DefaultConnection") || "";
  
  // Extract Server part (host,port)
  const serverMatch = connString.match(/Server=([^;]+)/);
  const serverPart = serverMatch?.[1] || "";
  const existingHost = serverPart.split(",")[0]?.trim() || undefined;
  const existingPort = serverPart.includes(",") ? serverPart.split(",")[1]?.trim() : (serverPart ? "0" : undefined);
  
  // Extract Database
  const existingDb = connString.match(/Database=([^;]+)/)?.[1]?.trim();
  
  // Extract Security
  const existingIntegrated = connString.includes("Integrated Security=True");
  
  // Extract User/Password
  const existingUser = connString.match(/User=([^;]+)/)?.[1]?.trim();
  const existingPass = connString.match(/Password=([^;]+)/)?.[1]?.trim();

  const config: BackendEnvConfig = { ...defaults };

  logInfo("Database Configuration:");
  config.dbHost = await promptValue("Database host", defaults.dbHost, existingHost);
  
  // For port, "0" is a valid meaningful value (omit port)
  config.dbPort = await promptValue("Database port", defaults.dbPort, existingPort, "number", true);
  
  config.dbName = await promptValue("Database name", defaults.dbName, existingDb);

  config.dbIntegratedSecurity = await promptValue(
    "Use Windows Authentication?",
    defaults.dbIntegratedSecurity,
    existingIntegrated ? "true" : "false",
    "confirm",
    true
  );

  if (!config.dbIntegratedSecurity) {
    config.dbUser = await promptValue("Database user", defaults.dbUser, existingUser);
    config.dbPassword = await promptValue("Database password", defaults.dbPassword, existingPass, "password");
  }

  logInfo("");
  logInfo("JWT Configuration:");
  config.jwtSecret = await promptValue("JWT secret key", defaults.jwtSecret, getExisting("Jwt__SecretKey"));
  config.jwtIssuer = await promptValue("JWT issuer (backend URL)", defaults.jwtIssuer, getExisting("Jwt__Issuer"));
  config.jwtAudience = await promptValue("JWT audience (frontend URL)", defaults.jwtAudience, getExisting("Jwt__Audience"));
  config.jwtExpirationMinutes = await promptValue(
    "JWT expiration (minutes)",
    defaults.jwtExpirationMinutes,
    getExisting("Jwt__ExpirationMinutes"),
    "number"
  );

  logInfo("");
  config.corsOrigins = await promptValue("CORS allowed origins", defaults.corsOrigins, getExisting("Cors__AllowedOrigins"));

  logInfo("");
  const logLevelResp = await prompts({
    type: "select",
    name: "value",
    message: "Logging level",
    choices: [
      { title: "Debug", value: "Debug" },
      { title: "Information", value: "Information" },
      { title: "Warning", value: "Warning" },
      { title: "Error", value: "Error" },
    ],
    initial: defaults.logLevel === "Debug" ? 0 : 1,
  });

  config.logLevel = (logLevelResp.value as string) || defaults.logLevel;

  config.seedDemoData = await promptValue("Seed demo data?", defaults.seedDemoData, getExisting("SEED_DEMO_DATA"), "confirm", true);

  logInfo("");
  logInfo("Google OAuth:");
  config.googleClientId = await promptValue("Google Client ID", defaults.googleClientId, getExisting("Google__ClientId"), "text", true);
  config.googleClientSecret = await promptValue(
    "Google Client Secret",
    defaults.googleClientSecret,
    getExisting("GOOGLE_CLIENT_SECRET"),
    "password",
    true
  );

  logInfo("");
  logInfo("Paymob Configuration:");
  config.paymobApiKey = await promptValue("Paymob API Key", defaults.paymobApiKey, getExisting("Paymob__ApiKey"), "text", true);
  config.paymobIntegrationId = await promptValue("Paymob Integration ID", defaults.paymobIntegrationId, getExisting("Paymob__IntegrationId"), "text", true);
  config.paymobIframeId = await promptValue("Paymob iFrame ID", defaults.paymobIframeId, getExisting("Paymob__IframeId"), "text", true);
  config.paymobHmacSecret = await promptValue("Paymob HMAC Secret", defaults.paymobHmacSecret, getExisting("Paymob__HmacSecret"), "password", true);

  logInfo("");
  logInfo("File Upload:");
  config.uploadPath = await promptValue("Upload path", defaults.uploadPath, getExisting("FileUpload__UploadPath"));
  config.maxUploadSizeMb = await promptValue("Max file size (MB)", defaults.maxUploadSizeMb, getExisting("FileUpload__MaxFileSizeMB"), "number");

  logInfo("");
  logInfo("Email (SMTP) Settings:");
  config.smtpHost = await promptValue("SMTP Host", defaults.smtpHost || "", getExisting("Email__SmtpHost"), "text", true);
  if (config.smtpHost) {
    config.smtpPort = await promptValue("SMTP Port", defaults.smtpPort || 587, getExisting("Email__SmtpPort"), "number", true);
    config.smtpUser = await promptValue("SMTP Username", defaults.smtpUser || "", getExisting("Email__SmtpUser"), "text", true);
    config.smtpPassword = await promptValue("SMTP Password", defaults.smtpPassword || "", getExisting("Email__SmtpPassword"), "password", true);
    config.smtpFromEmail = await promptValue("From Email", defaults.smtpFromEmail || "", getExisting("Email__FromEmail"), "text", true);
    config.smtpFromName = await promptValue("From Name", defaults.smtpFromName || "Ares Car Rental", getExisting("Email__FromName"), "text", true);
  }

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
Jwt__ExpirationMinutes=${config.jwtExpirationMinutes.toString()}

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
SEED_DEMO_DATA=${config.seedDemoData.toString()}

# ============================================
# File Upload Configuration
# ============================================
FileUpload__UploadPath=${config.uploadPath}
FileUpload__MaxFileSizeMB=${config.maxUploadSizeMb.toString()}

# ============================================
# Email Configuration (Optional)
# ============================================
${config.smtpHost ? `Email__SmtpHost=${config.smtpHost}` : "# Email__SmtpHost=smtp.example.com"}
${config.smtpPort ? `Email__SmtpPort=${config.smtpPort.toString()}` : "# Email__SmtpPort=587"}
${config.smtpUser ? `Email__SmtpUser=${config.smtpUser}` : "# Email__SmtpUser=user@example.com"}
${config.smtpPassword ? `Email__SmtpPassword=${config.smtpPassword}` : "# Email__SmtpPassword=password"}
${config.smtpFromEmail ? `Email__FromEmail=${config.smtpFromEmail}` : "# Email__FromEmail=noreply@ares.com"}
${config.smtpFromName ? `Email__FromName=${config.smtpFromName}` : "# Email__FromName=Ares Car Rental"}


# ============================================
# Paymob Payment Gateway (Sandbox)
# Sign up at: https://accept.paymob.com/portal2/en/register
# Dashboard: https://accept.paymob.com/portal2/en/login
# Get credentials from: Settings → Account Info & Payment Integrations
# ============================================
Paymob__ApiKey=${config.paymobApiKey}
Paymob__IntegrationId=${config.paymobIntegrationId}
Paymob__IframeId=${config.paymobIframeId}
Paymob__HmacSecret=${config.paymobHmacSecret}
Paymob__BaseUrl=${config.paymobBaseUrl}
`;
}

/**
 * Setup backend environment file
 */
export async function setupBackendEnv(quick = false, isDevcontainer = false): Promise<BackendEnvConfig> {
  const envPath = "backend/.env";
  const envExamplePath = "backend/.env.example";
  let existingEnv: Record<string, string> = {};
  let mode: "create" | "replace" | "upgrade" = "create";

  // Check if .env already exists
  if (await fileExists(envPath)) {
    logWarn(`Backend .env file already exists: ${envPath}`);

    if (!quick) {
      const response = await prompts({
        type: "select",
        name: "choice",
        message: "Existing .env file detected. What would you like to do?",
        choices: [
          { title: "Upgrade/Update (Preserve existing keys, choose values for project keys)", value: "upgrade" },
          { title: "Replace Entirely (Start fresh from defaults)", value: "replace" },
          { title: "Keep Existing (Skip configuration)", value: "keep" },
        ],
      });

      if (response.choice === "keep") {
        logInfo("Keeping existing .env file");
        const content = await Bun.file(envPath).text();
        return {
          ...getDefaultBackendConfig(isDevcontainer),
          ...parseEnv(content),
        } as unknown as BackendEnvConfig;
      }

      if (response.choice === "upgrade") {
        mode = "upgrade";
        const content = await Bun.file(envPath).text();
        existingEnv = parseEnv(content);
        await backupFile(envPath);
        logInfo("Existing .env backed up and loaded for upgrade");
      } else {
        mode = "replace";
        await backupFile(envPath);
        logInfo("Existing .env backed up; starting fresh");
      }
    } else {
      // In quick mode, backup and overwrite
      await backupFile(envPath);
      logInfo("Backed up existing .env file");
    }
  }

  // Get configuration
  const defaults = getDefaultBackendConfig(isDevcontainer);
  const config =
    quick || mode === "replace" || mode === "create"
      ? await promptBackendConfig(defaults, isDevcontainer)
      : await promptBackendConfig(defaults, isDevcontainer, existingEnv);

  // Generate .env content
  let envContent = generateBackendEnvContent(config);

  // If upgrading, append any unknown keys from existing env
  if (mode === "upgrade") {
    const projectKeys = new Set([
      "ConnectionStrings__DefaultConnection",
      "Jwt__SecretKey",
      "Jwt__Issuer",
      "Jwt__Audience",
      "Jwt__ExpirationMinutes",
      "Google__ClientId",
      "GOOGLE_CLIENT_SECRET",
      "Cors__AllowedOrigins",
      "Logging__LogLevel__Default",
      "ASPNETCORE_ENVIRONMENT",
      "ASPNETCORE_URLS",
      "SEED_DEMO_DATA",
      "FileUpload__UploadPath",
      "FileUpload__MaxFileSizeMB",
      "Email__SmtpHost",
      "Email__SmtpPort",
      "Email__SmtpUser",
      "Email__SmtpPassword",
      "Email__FromEmail",
      "Email__FromName",
      "Paymob__ApiKey",
      "Paymob__IntegrationId",
      "Paymob__IframeId",
      "Paymob__HmacSecret",
      "Paymob__BaseUrl",
    ]);

    let customKeysContent = "";
    for (const [key, value] of Object.entries(existingEnv)) {
      if (!projectKeys.has(key)) {
        customKeysContent += `${key}=${value}\n`;
      }
    }

    if (customKeysContent) {
      envContent += `\n# ============================================\n# Custom/Preserved Configuration\n# ============================================\n${customKeysContent}`;
    }
  }

  // Write .env file
  await Bun.write(envPath, envContent);
  logSuccess(`Backend .env file ${mode === "upgrade" ? "updated" : "created"}: ${envPath}`);

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
  if (!(await fileExists(envExamplePath))) {
    logInfo("Creating .env.example template...");
    const exampleConfig = { ...config };
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
