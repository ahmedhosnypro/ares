/**
 * Frontend Environment Configuration Module
 * Creates and manages frontend/.env.local file
 */

import { logInfo, logSuccess, logWarn, logDebug } from "../lib/logger";
import { fileExists, backupFile, parseEnv, prompts } from "../lib/utils";
import { generateNextAuthSecret } from "./secrets";
import type { BackendEnvConfig } from "./backend-env";

export interface FrontendEnvConfig {
  // NextAuth
  nextAuthUrl: string;
  nextAuthSecret: string;

  // API
  nextPublicApiBaseUrl: string;

  // App
  nextPublicAppName: string;
  nextPublicAppUrl: string;

  // Features
  nextPublicEnableAnalytics: boolean;
  nextPublicEnableDebug: boolean;
  nextPublicDemoLogin: boolean;

  // JWT Timing alignment
  nextPublicJwtExpirationMinutes: number;

  // Google OAuth
  nextPublicGoogleClientId?: string;

  // Google Maps (optional)
  nextPublicGoogleMapsApiKey?: string;

  // Stripe (optional)
  nextPublicStripePublishableKey?: string;
  stripeSecretKey?: string;
}

/**
 * Get default frontend configuration
 */
export function getDefaultFrontendConfig(backendConfig?: BackendEnvConfig): FrontendEnvConfig {
  const backendUrl = backendConfig?.jwtIssuer || "http://localhost:5000";
  const frontendUrl = backendConfig?.jwtAudience || "http://localhost:3000";
  const expiration = backendConfig?.jwtExpirationMinutes || 60;

  return {
    // NextAuth
    nextAuthUrl: frontendUrl,
    nextAuthSecret: generateNextAuthSecret(),

    // API
    nextPublicApiBaseUrl: backendUrl,

    // App
    nextPublicAppName: "Ares Car Rental",
    nextPublicAppUrl: frontendUrl,

    // Features
    nextPublicEnableAnalytics: false,
    nextPublicEnableDebug: true,
    nextPublicDemoLogin: false,

    // Timing
    nextPublicJwtExpirationMinutes: expiration,
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

  if (isValueEmpty && !allowEmpty) {
    const response = await prompts({
      type,
      name: "value",
      message,
      initial: defaultValue,
    });
    return response.value as T;
  }

  const displayValue = existingValue === undefined || existingValue.trim() === "" ? "(Empty/None)" : existingValue;

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

  const newResponse = await prompts({
    type,
    name: "value",
    message: `Enter new value for ${message.toLowerCase()}:`,
    initial: defaultValue,
  });
  return newResponse.value as T;
}

/**
 * Prompt user for frontend configuration (interactive mode)
 */
export async function promptFrontendConfig(
  defaults: FrontendEnvConfig,
  existingEnv: Record<string, string> = {}
): Promise<FrontendEnvConfig> {
  logInfo("Configuring frontend environment...");

  const getExisting = (key: string) => existingEnv[key];
  const config: FrontendEnvConfig = { ...defaults };

  config.nextAuthUrl = await promptValue("NextAuth URL", defaults.nextAuthUrl, getExisting("NEXTAUTH_URL"));
  config.nextAuthSecret = await promptValue(
    "NextAuth secret",
    defaults.nextAuthSecret,
    getExisting("NEXTAUTH_SECRET")
  );
  config.nextPublicApiBaseUrl = await promptValue(
    "API base URL",
    defaults.nextPublicApiBaseUrl,
    getExisting("NEXT_PUBLIC_API_BASE_URL")
  );
  config.nextPublicAppName = await promptValue(
    "Application name",
    defaults.nextPublicAppName,
    getExisting("NEXT_PUBLIC_APP_NAME")
  );
  config.nextPublicJwtExpirationMinutes = await promptValue(
    "JWT expiration alignment (minutes)",
    defaults.nextPublicJwtExpirationMinutes,
    getExisting("NEXT_PUBLIC_JWT_EXPIRATION_MINUTES"),
    "number"
  );

  config.nextPublicEnableAnalytics = await promptValue(
    "Enable analytics?",
    defaults.nextPublicEnableAnalytics,
    getExisting("NEXT_PUBLIC_ENABLE_ANALYTICS"),
    "confirm"
  );
  config.nextPublicEnableDebug = await promptValue(
    "Enable debug mode?",
    defaults.nextPublicEnableDebug,
    getExisting("NEXT_PUBLIC_ENABLE_DEBUG"),
    "confirm"
  );
  config.nextPublicDemoLogin = await promptValue(
    "Enable demo login?",
    defaults.nextPublicDemoLogin,
    getExisting("NEXT_PUBLIC_DEMO_LOGIN"),
    "confirm"
  );

  const configureOptional = await prompts({
    type: "confirm",
    name: "value",
    message: "Configure optional services (Google, Maps, Stripe)?",
    initial: false,
  });

  if (configureOptional.value) {
    config.nextPublicGoogleClientId = await promptValue(
      "Google Client ID",
      defaults.nextPublicGoogleClientId || "",
      getExisting("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
    );
    config.nextPublicGoogleMapsApiKey = await promptValue(
      "Google Maps API key",
      defaults.nextPublicGoogleMapsApiKey || "",
      getExisting("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    );
    config.nextPublicStripePublishableKey = await promptValue(
      "Stripe publishable key",
      defaults.nextPublicStripePublishableKey || "",
      getExisting("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
    );
    config.stripeSecretKey = await promptValue(
      "Stripe secret key",
      defaults.stripeSecretKey || "",
      getExisting("STRIPE_SECRET_KEY"),
      "password"
    );
  }

  return config;
}

/**
 * Generate frontend .env.local file content
 */
export function generateFrontendEnvContent(config: FrontendEnvConfig): string {
  return `# Ares Car Rental - Frontend Environment Configuration
# Generated: ${new Date().toISOString()}
# DO NOT commit this file to version control!

# ============================================
# NextAuth Configuration
# ============================================
NEXTAUTH_URL=${config.nextAuthUrl}
NEXTAUTH_SECRET=${config.nextAuthSecret}

# ============================================
# API Configuration
# ============================================
NEXT_PUBLIC_API_BASE_URL=${config.nextPublicApiBaseUrl}

# ============================================
# Application Configuration
# ============================================
NEXT_PUBLIC_APP_NAME=${config.nextPublicAppName}
NEXT_PUBLIC_APP_URL=${config.nextPublicAppUrl}

# ============================================
# Timing & Security Alignment
# ============================================
# This matches the backend's Jwt__ExpirationMinutes
NEXT_PUBLIC_JWT_EXPIRATION_MINUTES=${config.nextPublicJwtExpirationMinutes.toString()}

# ============================================
# Feature Flags
# ============================================
NEXT_PUBLIC_ENABLE_ANALYTICS=${config.nextPublicEnableAnalytics.toString()}
NEXT_PUBLIC_ENABLE_DEBUG=${config.nextPublicEnableDebug.toString()}
NEXT_PUBLIC_DEMO_LOGIN=${config.nextPublicDemoLogin.toString()}

# ============================================
# Google OAuth Configuration
# ============================================
${config.nextPublicGoogleClientId ? `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${config.nextPublicGoogleClientId}` : "# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id"}

# ============================================
# Optional Services
# ============================================
${config.nextPublicGoogleMapsApiKey ? `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${config.nextPublicGoogleMapsApiKey}` : "# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key"}

${config.nextPublicStripePublishableKey ? `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${config.nextPublicStripePublishableKey}` : "# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..."}
${config.stripeSecretKey ? `STRIPE_SECRET_KEY=${config.stripeSecretKey}` : "# STRIPE_SECRET_KEY=sk_test_..."}
`;
}

/**
 * Setup frontend environment file
 */
export async function setupFrontendEnv(
  quick = false,
  backendConfig?: BackendEnvConfig
): Promise<FrontendEnvConfig> {
  const envPath = "frontend/.env.local";
  const envExamplePath = "frontend/.env.example";
  let existingEnv: Record<string, string> = {};
  let mode: "create" | "replace" | "upgrade" = "create";

  // Check if .env.local already exists
  if (await fileExists(envPath)) {
    logWarn(`Frontend .env.local file already exists: ${envPath}`);

    if (!quick) {
      const response = await prompts({
        type: "select",
        name: "choice",
        message: "Existing .env.local file detected. What would you like to do?",
        choices: [
          { title: "Upgrade/Update (Preserve existing keys, choose values for project keys)", value: "upgrade" },
          { title: "Replace Entirely (Start fresh from defaults)", value: "replace" },
          { title: "Keep Existing (Skip configuration)", value: "keep" },
        ],
      });

      if (response.choice === "keep") {
        logInfo("Keeping existing .env.local file");
        const content = await Bun.file(envPath).text();
        return {
          ...getDefaultFrontendConfig(backendConfig),
          ...parseEnv(content),
        } as unknown as FrontendEnvConfig;
      }

      if (response.choice === "upgrade") {
        mode = "upgrade";
        const content = await Bun.file(envPath).text();
        existingEnv = parseEnv(content);
        await backupFile(envPath);
        logInfo("Existing .env.local backed up and loaded for upgrade");
      } else {
        mode = "replace";
        await backupFile(envPath);
        logInfo("Existing .env.local backed up; starting fresh");
      }
    } else {
      await backupFile(envPath);
      logInfo("Backed up existing .env.local file");
    }
  }

  // Get configuration
  const defaults = getDefaultFrontendConfig(backendConfig);
  const config = quick
    ? defaults
    : mode === "replace" || mode === "create"
      ? await promptFrontendConfig(defaults)
      : await promptFrontendConfig(defaults, existingEnv);

  // Generate .env.local content
  let envContent = generateFrontendEnvContent(config);

  // If upgrading, append any unknown keys from existing env
  if (mode === "upgrade") {
    const projectKeys = new Set([
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "NEXT_PUBLIC_API_BASE_URL",
      "NEXT_PUBLIC_APP_NAME",
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_JWT_EXPIRATION_MINUTES",
      "NEXT_PUBLIC_ENABLE_ANALYTICS",
      "NEXT_PUBLIC_ENABLE_DEBUG",
      "NEXT_PUBLIC_DEMO_LOGIN",
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_SECRET_KEY",
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

  // Write .env.local file
  await Bun.write(envPath, envContent);
  logSuccess(`Frontend .env.local file ${mode === "upgrade" ? "updated" : "created"}: ${envPath}`);

  // Set file permissions (Unix-like systems only)
  try {
    if (process.platform !== "win32") {
      await Bun.$`chmod 600 ${envPath}`.quiet();
      logDebug("Set .env.local file permissions to 600");
    }
  } catch (error) {
    logDebug(`Could not set file permissions: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Only update .env.example if it doesn't exist
  if (!(await fileExists(envExamplePath))) {
    logInfo("Creating .env.example template...");
    const exampleConfig = { ...config };
    exampleConfig.nextAuthSecret = "your-nextauth-secret-min-32-characters-long";
    if (exampleConfig.nextPublicGoogleMapsApiKey) {
      exampleConfig.nextPublicGoogleMapsApiKey = "your-google-maps-api-key";
    }
    if (exampleConfig.nextPublicStripePublishableKey) {
      exampleConfig.nextPublicStripePublishableKey = "pk_test_your_stripe_publishable_key";
    }
    if (exampleConfig.stripeSecretKey) {
      exampleConfig.stripeSecretKey = "sk_test_your_stripe_secret_key";
    }

    const exampleContent = generateFrontendEnvContent(exampleConfig);
    await Bun.write(envExamplePath, exampleContent);
    logSuccess("Created .env.example");
  }

  return config;
}
