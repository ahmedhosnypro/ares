/**
 * Backend Build Module
 * Builds the .NET backend project
 */

import { $ } from "bun";
import { logInfo, logSuccess, logError, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface BuildResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
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
 * Restore NuGet packages
 */
export async function restorePackages(): Promise<BuildResult> {
  logInfo("Restoring NuGet packages...");

  // Stop any running backend processes first
  await stopRunningBackendProcesses();

  startSpinner("Running dotnet restore...");
  const startTime = Date.now();

  try {
    const result = await $`dotnet restore backend/Api/Api.csproj`.text();
    const duration = Date.now() - startTime;

    stopSpinner(true, `Packages restored in ${String(Math.round(duration / 1000))}s`);
    logDebug("Restore output:");
    logDebug(result);

    return {
      success: true,
      output: result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Package restore failed");
    logError(`Restore error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Build the backend project
 */
export async function buildBackend(configuration = "Release"): Promise<BuildResult> {
  logInfo(`Building backend (${configuration})...`);

  startSpinner("Compiling .NET project...");
  const startTime = Date.now();

  try {
    const result = await $`dotnet build backend/Api/Api.csproj --configuration ${configuration} --no-restore`.text();
    const duration = Date.now() - startTime;

    stopSpinner(true, `Build completed in ${String(Math.round(duration / 1000))}s`);
    logDebug("Build output:");
    logDebug(result);

    return {
      success: true,
      output: result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Build failed");
    logError(`Build error: ${errorMessage}`);

    // Try to extract more details from the error
    if (error && typeof error === "object" && "stderr" in error) {
      const stderr = String(error.stderr);
      if (stderr) {
        logDebug("Error details:");
        logDebug(stderr);
      }
    }

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Clean build artifacts
 */
export async function cleanBackend(): Promise<BuildResult> {
  logInfo("Cleaning build artifacts...");

  startSpinner("Running dotnet clean...");

  try {
    const result = await $`dotnet clean backend/Api/Api.csproj`.text();

    stopSpinner(true, "Clean completed");
    logDebug(result);

    return {
      success: true,
      output: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Clean failed");
    logError(`Clean error: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Build backend with restore
 */
export async function setupBackendBuild(): Promise<boolean> {
  logInfo("Setting up backend build...");
  logInfo("");

  // Restore packages
  const restoreResult = await restorePackages();
  if (!restoreResult.success) {
    logError("Failed to restore packages");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check your internet connection");
    logInfo("  2. Verify NuGet package sources are accessible");
    logInfo("  3. Try running manually: cd backend/Api && dotnet restore");
    logInfo("");
    return false;
  }

  logInfo("");

  // Build project
  const buildResult = await buildBackend();
  if (!buildResult.success) {
    logError("Failed to build backend");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check for compilation errors in the output above");
    logInfo("  2. Ensure all dependencies are installed");
    logInfo("  3. Try running manually: cd backend/Api && dotnet build");
    logInfo("");
    return false;
  }

  logInfo("");
  logSuccess("Backend build completed successfully!");
  return true;
}
