/**
 * Database Migrations Module
 * Runs EF Core migrations using dotnet ef
 */

import { $ } from "bun";
import { logInfo, logSuccess, logError, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface MigrationResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Check if there are pending migrations
 */
export async function checkPendingMigrations(): Promise<boolean> {
  logDebug("Checking for pending migrations...");

  startSpinner("Checking database migration status...");

  try {
    const result =
      await $`dotnet ef migrations list --project backend/Infrastructure --startup-project backend/Api`.text();

    // If there are pending migrations, they'll be marked with (Pending)
    const hasPending = result.includes("(Pending)");

    if (hasPending) {
      stopSpinner(true, "Pending migrations found");
    } else {
      stopSpinner(true, "Database is up to date");
    }

    return hasPending;
  } catch (error) {
    stopSpinner(false, "Could not check migration status");
    logDebug(`Could not check migrations: ${error instanceof Error ? error.message : "Unknown error"}`);
    // If we can't check, assume we need to run migrations
    return true;
  }
}

/**
 * Stop any running backend processes that might lock DLL files
 */
async function stopRunningBackendProcesses(): Promise<boolean> {
  logDebug("Checking for running backend processes...");

  try {
    // Check if Api process is running (Windows)
    const checkProc = Bun.spawn(["powershell", "-Command", "Get-Process -Name 'Api' -ErrorAction SilentlyContinue"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    await checkProc.exited;
    const output = await new Response(checkProc.stdout).text();

    if (output.trim() && output.includes("Api")) {
      logInfo("Stopping running backend process...");
      startSpinner("Stopping Api process...");

      // Kill the process
      const killProc = Bun.spawn(["powershell", "-Command", "Stop-Process -Name 'Api' -Force -ErrorAction SilentlyContinue"], {
        stdout: "pipe",
        stderr: "pipe",
      });

      await killProc.exited;
      
      // Wait a bit for the process to fully terminate
      await Bun.sleep(2000);

      stopSpinner(true, "Backend process stopped");
      return true;
    }

    logDebug("No running backend processes found");
    return true;
  } catch (error) {
    logDebug(`Error checking for running processes: ${error instanceof Error ? error.message : "Unknown error"}`);
    // Continue anyway - this is not critical
    return true;
  }
}

/**
 * Restore NuGet packages for backend projects
 */
async function restoreNuGetPackages(): Promise<boolean> {
  logDebug("Restoring NuGet packages...");

  startSpinner("Restoring NuGet packages...");

  try {
    const proc = Bun.spawn(["dotnet", "restore", "backend/Api/Api.csproj"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();

    if (exitCode === 0) {
      stopSpinner(true, "NuGet packages restored successfully");
      logDebug("Restore output:");
      logDebug(output);
      return true;
    }

    stopSpinner(false, "NuGet restore failed");
    logError(`Restore error: ${errorOutput || output}`);
    logDebug("Restore output:");
    logDebug(output);
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "NuGet restore failed");
    logError(`Restore error: ${errorMessage}`);
    return false;
  }
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<MigrationResult> {
  logInfo("Running database migrations...");

  // Load .env file
  const envVars = await loadBackendEnv();
  if (!envVars) {
    logError("Failed to load backend .env file");
    return {
      success: false,
      error: "Could not load backend/.env",
    };
  }

  // Stop any running backend processes first
  await stopRunningBackendProcesses();

  // Restore NuGet packages first
  const restoreSuccess = await restoreNuGetPackages();
  if (!restoreSuccess) {
    return {
      success: false,
      error: "Failed to restore NuGet packages",
    };
  }

  startSpinner("Applying migrations to database...");

  try {
    // Run migrations from the Api project with environment variables
    const proc = Bun.spawn(
      ["dotnet", "ef", "database", "update", "--project", "backend/Infrastructure", "--startup-project", "backend/Api"],
      {
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          ...envVars,
        },
      }
    );

    const exitCode = await proc.exited;
    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();

    if (exitCode === 0) {
      stopSpinner(true, "Database migrations completed successfully");
      logDebug("Migration output:");
      logDebug(output);

      return {
        success: true,
        output,
      };
    }

    stopSpinner(false, "Migration failed");
    logError(`Migration error: ${errorOutput || output}`);
    logDebug("Migration output:");
    logDebug(output);

    return {
      success: false,
      error: errorOutput || output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Migration failed");
    logError(`Migration error: ${errorMessage}`);

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
 * Create initial migration if none exist
 */
export async function createInitialMigration(): Promise<MigrationResult> {
  logInfo("Creating initial migration...");

  startSpinner("Generating migration files...");

  try {
    const result =
      await $`dotnet ef migrations add InitialCreate --project backend/Infrastructure --startup-project backend/Api`.text();

    stopSpinner(true, "Initial migration created");
    logDebug(result);

    return {
      success: true,
      output: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Failed to create migration");
    logError(`Migration creation error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Setup database with migrations
 */
export async function setupDatabase(): Promise<boolean> {
  logInfo("Setting up database...");
  logInfo("");

  // Check if migrations exist
  const hasPending = await checkPendingMigrations();

  if (!hasPending) {
    // Message already shown by spinner
    return true;
  }

  logInfo("");

  // Run migrations
  const result = await runMigrations();

  if (!result.success) {
    logError("Failed to apply migrations");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Ensure the database connection is working");
    logInfo("  2. Check if the database user has sufficient permissions");
    logInfo("  3. Review the error message above for specific issues");
    logInfo("  4. Try running manually: cd backend/Api && dotnet ef database update");
    logInfo("");
    return false;
  }

  logSuccess("Database setup completed successfully!");
  return true;
}

/**
 * Reset database (drop and recreate)
 */
export async function resetDatabase(): Promise<MigrationResult> {
  logInfo("Resetting database...");

  startSpinner("Dropping and recreating database...");

  try {
    // Drop the database
    await $`dotnet ef database drop --force --project backend/Infrastructure --startup-project backend/Api`.quiet();

    // Recreate with migrations
    const result =
      await $`dotnet ef database update --project backend/Infrastructure --startup-project backend/Api`.text();

    stopSpinner(true, "Database reset completed");
    logDebug(result);

    return {
      success: true,
      output: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Database reset failed");
    logError(`Reset error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
