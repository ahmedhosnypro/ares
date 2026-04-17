/**
 * Frontend Install Module
 * Installs frontend dependencies using Bun
 */

import { $ } from "bun";
import { logInfo, logSuccess, logError, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface InstallResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
}

/**
 * Install frontend dependencies
 */
export async function installFrontendDependencies(): Promise<InstallResult> {
  logInfo("Installing frontend dependencies...");

  startSpinner("Running bun install...");
  const startTime = Date.now();

  try {
    const result = await $`bun install`.cwd("frontend").text();
    const duration = Date.now() - startTime;

    stopSpinner(true, `Dependencies installed in ${String(Math.round(duration / 1000))}s`);
    logDebug("Install output:");
    logDebug(result);

    return {
      success: true,
      output: result,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Installation failed");
    logError(`Install error: ${errorMessage}`);

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
 * Check if node_modules exists
 */
export async function checkDependenciesInstalled(): Promise<boolean> {
  try {
    const nodeModules = Bun.file("frontend/node_modules");
    return await nodeModules.exists();
  } catch {
    return false;
  }
}

/**
 * Setup frontend dependencies
 */
export async function setupFrontendDependencies(): Promise<boolean> {
  logInfo("Setting up frontend dependencies...");
  logInfo("");

  // Check if dependencies are already installed
  const alreadyInstalled = await checkDependenciesInstalled();
  if (alreadyInstalled) {
    logInfo("Dependencies already installed, skipping...");
    return true;
  }

  // Install dependencies
  const installResult = await installFrontendDependencies();

  if (!installResult.success) {
    logError("Failed to install frontend dependencies");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check your internet connection");
    logInfo("  2. Verify package.json is valid");
    logInfo("  3. Try running manually: cd frontend && bun install");
    logInfo("  4. Check if Bun is properly installed");
    logInfo("");
    return false;
  }

  logInfo("");
  logSuccess("Frontend dependencies installed successfully!");
  return true;
}
