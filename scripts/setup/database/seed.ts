/**
 * Database Seeding Module
 * Seeds demo data into the database
 */

import { logInfo, logSuccess, logError, logWarn, logDebug, startSpinner, stopSpinner } from "../lib/logger";
import { parseEnvFile } from "../config/validate";
import { fileExists, askYesNo } from "../lib/utils";

export interface SeedResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Check if seeding is enabled in backend .env
 */
export async function isSeedingEnabled(): Promise<boolean> {
  const envPath = "backend/.env";

  if (!(await fileExists(envPath))) {
    logDebug("Backend .env file not found, assuming seeding is disabled");
    return false;
  }

  try {
    const env = await parseEnvFile(envPath);
    const seedValue = env.SEED_DEMO_DATA?.toLowerCase();

    return seedValue === "true";
  } catch (error) {
    logDebug(`Could not read SEED_DEMO_DATA: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Seed demo data by running the backend with seeding enabled
 */
export async function seedDemoData(): Promise<SeedResult> {
  logInfo("Seeding demo data...");

  // Load .env file
  const envVars = await loadBackendEnv();
  if (!envVars) {
    logError("Failed to load backend .env file");
    return {
      success: false,
      error: "Could not load backend/.env",
    };
  }

  logDebug(`Loaded ${String(Object.keys(envVars).length)} environment variables`);
  logDebug(`SEED_DEMO_DATA = ${envVars.SEED_DEMO_DATA || "not set"}`);

  startSpinner("Running database seeder...");

  try {
    // The backend application will seed data on startup if SEED_DEMO_DATA=true
    // We'll run it briefly with the --seed-only flag
    const proc = Bun.spawn(["dotnet", "run", "--project", "backend/Api", "--no-build", "--", "--seed-only"], {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        ...envVars,
      },
    });

    const result = await proc.exited;
    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();

    logDebug("Seeder stdout:");
    logDebug(output);
    if (errorOutput) {
      logDebug("Seeder stderr:");
      logDebug(errorOutput);
    }

    if (result === 0) {
      stopSpinner(true, "Demo data seeded successfully");

      return {
        success: true,
        output,
      };
    }

    // Check if the error is because --seed-only flag doesn't exist
    if (
      output.includes("seed-only") ||
      output.includes("Unrecognized") ||
      errorOutput.includes("seed-only") ||
      errorOutput.includes("Unrecognized")
    ) {
      logDebug("--seed-only flag not supported, trying alternative approach");
      stopSpinner(false, "Seed flag not supported");

      // Try running without the flag (app will seed on startup)
      return await seedViaStartup(envVars);
    }

    stopSpinner(false, "Seeding failed");
    logError(`Seeding error: ${output || errorOutput}`);

    return {
      success: false,
      error: output || errorOutput,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Seeding failed");
    logError(`Seeding error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Load environment variables from backend/.env file
 */
async function loadBackendEnv(): Promise<Record<string, string> | null> {
  const envPath = "backend/.env";

  try {
    const envFile = await Bun.file(envPath).text();
    const envVars: Record<string, string> = {};

    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse key=value
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }

      envVars[key] = value;
    }

    logDebug(`Loaded ${String(Object.keys(envVars).length)} environment variables from ${envPath}`);
    return envVars;
  } catch (error) {
    logError(`Failed to load ${envPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

/**
 * Seed data by starting the application briefly
 */
async function seedViaStartup(envVars: Record<string, string>): Promise<SeedResult> {
  logInfo("Seeding via application startup...");

  startSpinner("Starting backend to seed data...");

  try {
    // Start the backend process with environment variables
    const proc = Bun.spawn(["dotnet", "run", "--project", "backend/Api", "--no-build"], {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        ...envVars,
      },
    });

    // Wait for seeding to complete (look for specific log message or timeout)
    let output = "";
    let seeded = false;
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    // Read output and look for seeding completion
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    while (Date.now() - startTime < timeout) {
      const { value, done } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      output += chunk;

      // Look for seeding completion indicators
      if (
        chunk.includes("Demo data seeded") ||
        chunk.includes("Seeding completed") ||
        chunk.includes("Application started")
      ) {
        seeded = true;
        break;
      }

      await Bun.sleep(100);
    }

    // Kill the process
    proc.kill();

    if (seeded) {
      stopSpinner(true, "Demo data seeded successfully");
      return {
        success: true,
        output,
      };
    }

    stopSpinner(false, "Seeding timeout");
    logWarn("Could not confirm seeding completion");

    return {
      success: false,
      error: "Seeding timeout - data may or may not have been seeded",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Seeding failed");
    logError(`Seeding error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Setup database seeding
 */
export async function setupSeeding(quick = false): Promise<boolean> {
  logInfo("Checking seeding configuration...");

  // Check if seeding is enabled
  const seedingEnabled = await isSeedingEnabled();

  if (!seedingEnabled) {
    if (quick) {
      logInfo("Seeding is disabled in backend/.env (SEED_DEMO_DATA=false)");
      return true;
    }

    const shouldSeed = await askYesNo("Seed demo data into the database?", true);

    if (!shouldSeed) {
      logInfo("Skipping demo data seeding");
      return true;
    }

    logWarn("Note: SEED_DEMO_DATA is set to false in backend/.env");
    logInfo("The application will not seed data on subsequent startups");
  }

  // Seed the data
  const result = await seedDemoData();

  if (!result.success) {
    logError("Failed to seed demo data");
    logInfo("");
    logInfo("You can seed data manually by:");
    logInfo("  1. Setting SEED_DEMO_DATA=true in backend/.env");
    logInfo("  2. Running: cd backend/Api && dotnet run");
    logInfo("  3. The app will seed data on startup");
    logInfo("");

    if (!quick) {
      const shouldContinue = await askYesNo("Continue without seeding?", false);
      return shouldContinue;
    }

    return false;
  }

  logSuccess("Demo data seeded successfully!");
  return true;
}
