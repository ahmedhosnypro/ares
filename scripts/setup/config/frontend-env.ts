/**
 * Frontend Environment Configuration Module
 * Creates and manages frontend/.env.local file
 */

import prompts from "prompts";
import { logInfo, logSuccess, logWarn, logDebug } from "../lib/logger";
import { fileExists, backupFile } from "../lib/utils";
import { generateNextAuthSecret } from "./secrets";

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

  // Google Maps (optional)
  nextPublicGoogleMapsApiKey?: string;

  // Stripe (optional)
  nextPublicStripePublishableKey?: string;
  stripeSecretKey?: string;
}

/**
 * Get default frontend configuration
 */
export function getDefaultFrontendConfig(backendUrl = "http://localhost:5000"): FrontendEnvConfig {
  return {
    // NextAuth
    nextAuthUrl: "http://localhost:3000",
    nextAuthSecret: generateNextAuthSecret(),

    // API
    nextPublicApiBaseUrl: backendUrl,

    // App
    nextPublicAppName: "Ares Car Rental",
    nextPublicAppUrl: "http://localhost:3000",

    // Features
    nextPublicEnableAnalytics: false,
    nextPublicEnableDebug: true,
  };
}

/**
 * Prompt user for frontend configuration (interactive mode)
 */
export async function promptFrontendConfig(defaults: FrontendEnvConfig): Promise<FrontendEnvConfig> {
  logInfo("Configuring frontend environment...");
  logInfo("Press Enter to use default values shown in parentheses");
  logInfo("");

  const response = await prompts([
    {
      type: "text",
      name: "nextAuthUrl",
      message: "NextAuth URL (frontend URL)",
      initial: defaults.nextAuthUrl,
    },
    {
      type: "text",
      name: "nextAuthSecret",
      message: "NextAuth secret (press Enter to auto-generate)",
      initial: defaults.nextAuthSecret,
    },
    {
      type: "text",
      name: "nextPublicApiBaseUrl",
      message: "API base URL (backend URL)",
      initial: defaults.nextPublicApiBaseUrl,
    },
    {
      type: "text",
      name: "nextPublicAppName",
      message: "Application name",
      initial: defaults.nextPublicAppName,
    },
    {
      type: "confirm",
      name: "nextPublicEnableDebug",
      message: "Enable debug mode?",
      initial: defaults.nextPublicEnableDebug,
    },
    {
      type: "confirm",
      name: "addOptionalServices",
      message: "Configure optional services (Google Maps, Stripe)?",
      initial: false,
    },
  ]);

  // Handle user cancellation (Ctrl+C)
  if (Object.keys(response).length === 0) {
    logWarn("Configuration cancelled by user");
    process.exit(0);
  }

  const config: FrontendEnvConfig = {
    ...defaults,
    nextAuthUrl: response.nextAuthUrl as string,
    nextAuthSecret: response.nextAuthSecret as string,
    nextPublicApiBaseUrl: response.nextPublicApiBaseUrl as string,
    nextPublicAppName: response.nextPublicAppName as string,
    nextPublicEnableDebug: response.nextPublicEnableDebug as boolean,
  };

  // Prompt for optional services if requested
  if (response.addOptionalServices as boolean) {
    const optionalResponse = await prompts([
      {
        type: "text",
        name: "nextPublicGoogleMapsApiKey",
        message: "Google Maps API key (optional, press Enter to skip)",
        initial: "",
      },
      {
        type: "text",
        name: "nextPublicStripePublishableKey",
        message: "Stripe publishable key (optional, press Enter to skip)",
        initial: "",
      },
      {
        type: "text",
        name: "stripeSecretKey",
        message: "Stripe secret key (optional, press Enter to skip)",
        initial: "",
      },
    ]);

    // Only add non-empty optional values
    if (optionalResponse.nextPublicGoogleMapsApiKey as string) {
      config.nextPublicGoogleMapsApiKey = optionalResponse.nextPublicGoogleMapsApiKey as string;
    }
    if (optionalResponse.nextPublicStripePublishableKey as string) {
      config.nextPublicStripePublishableKey = optionalResponse.nextPublicStripePublishableKey as string;
    }
    if (optionalResponse.stripeSecretKey as string) {
      config.stripeSecretKey = optionalResponse.stripeSecretKey as string;
    }
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
# Feature Flags
# ============================================
NEXT_PUBLIC_ENABLE_ANALYTICS=${String(config.nextPublicEnableAnalytics)}
NEXT_PUBLIC_ENABLE_DEBUG=${String(config.nextPublicEnableDebug)}

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
  backendUrl = "http://localhost:5000"
): Promise<FrontendEnvConfig> {
  const envPath = "frontend/.env.local";
  const envExamplePath = "frontend/.env.example";

  // Check if .env.local already exists
  if (await fileExists(envPath)) {
    logWarn(`Frontend .env.local file already exists: ${envPath}`);

    if (!quick) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { shouldOverwrite } = await prompts({
        type: "confirm",
        name: "shouldOverwrite",
        message: "Overwrite existing .env.local file?",
        initial: false,
      });

      if (!shouldOverwrite) {
        logInfo("Keeping existing .env.local file");
        // Read and parse existing config (simplified - just return defaults)
        return getDefaultFrontendConfig(backendUrl);
      }

      // Backup existing file
      await backupFile(envPath);
      logInfo("Backed up existing .env.local file");
    } else {
      // In quick mode, backup and overwrite
      await backupFile(envPath);
      logInfo("Backed up existing .env.local file");
    }
  }

  // Get configuration
  const defaults = getDefaultFrontendConfig(backendUrl);
  const config = quick ? defaults : await promptFrontendConfig(defaults);

  // Generate .env.local content
  const envContent = generateFrontendEnvContent(config);

  // Write .env.local file
  await Bun.write(envPath, envContent);
  logSuccess(`Frontend .env.local file created: ${envPath}`);

  // Set file permissions (Unix-like systems only)
  try {
    if (process.platform !== "win32") {
      await Bun.$`chmod 600 ${envPath}`.quiet();
      logDebug("Set .env.local file permissions to 600");
    }
  } catch (error) {
    logDebug(`Could not set file permissions: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Update .env.example if it exists
  if (await fileExists(envExamplePath)) {
    logInfo("Updating .env.example with new structure...");
    const exampleConfig = { ...config };
    // Replace sensitive values with placeholders
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
    logSuccess("Updated .env.example");
  }

  return config;
}
