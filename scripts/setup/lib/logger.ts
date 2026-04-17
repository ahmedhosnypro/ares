/**
 * Logger Module
 *
 * Provides formatted logging functions with colors, icons, and spinner support.
 * All logging functions are spinner-aware and will pause/resume spinners automatically.
 *
 * @module logger
 */

import chalk from "chalk";
import ora, { type Ora } from "ora";
import { colors } from "./colors";

let currentSpinner: Ora | null = null;
let debugMode = false;

/**
 * Enable or disable debug logging
 *
 * @param enabled - Whether to enable debug mode
 *
 * @example
 * ```typescript
 * setDebugMode(true);
 * logDebug("This will now be visible");
 * ```
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * Log an informational message with an info icon (ℹ)
 *
 * @param message - The message to log
 *
 * @example
 * ```typescript
 * logInfo("Starting database migration...");
 * ```
 */
export function logInfo(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.info("ℹ"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Log a success message with a check mark icon (✔)
 *
 * @param message - The message to log
 *
 * @example
 * ```typescript
 * logSuccess("Database migration completed successfully");
 * ```
 */
export function logSuccess(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.success("✔"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Log an error message with an X icon (✖)
 *
 * @param message - The error message to log
 *
 * @example
 * ```typescript
 * logError("Database connection failed");
 * ```
 */
export function logError(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.error(colors.error("✖"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Log a warning message with a warning icon (⚠)
 *
 * @param message - The warning message to log
 *
 * @example
 * ```typescript
 * logWarn("Port 5000 is already in use");
 * ```
 */
export function logWarn(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.warn(colors.warn("⚠"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Log a debug message (only visible when debug mode is enabled)
 *
 * @param message - The debug message to log
 *
 * @example
 * ```typescript
 * setDebugMode(true);
 * logDebug("Connection string: " + connectionString);
 * ```
 */
export function logDebug(message: string): void {
  if (!debugMode) return;

  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.debug("🐛"), colors.dim(message));
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Log a major step header with decorative borders
 *
 * @param message - The step name to display
 *
 * @example
 * ```typescript
 * logStep("System Checks");
 * // Output:
 * //
 * // ━━━ System Checks ━━━
 * //
 * ```
 */
export function logStep(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log("");
  console.log(colors.bold("━━━"), colors.bold(message), colors.bold("━━━"));
  console.log("");
}

/**
 * Log a substep with indentation and arrow
 *
 * @param message - The substep message to display
 *
 * @example
 * ```typescript
 * logSubstep("Checking .NET SDK version...");
 * ```
 */
export function logSubstep(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log("  ", colors.dim("→"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

/**
 * Start a spinner with a message
 *
 * @param message - The message to display with the spinner
 * @returns The Ora spinner instance
 *
 * @example
 * ```typescript
 * const spinner = startSpinner("Installing dependencies...");
 * // ... do work ...
 * stopSpinner(true, "Dependencies installed successfully");
 * ```
 */
export function startSpinner(message: string): Ora {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  currentSpinner = ora(message).start();
  return currentSpinner;
}

/**
 * Stop the current spinner with success or failure
 *
 * @param success - Whether the operation succeeded
 * @param message - Optional message to display when stopping
 *
 * @example
 * ```typescript
 * startSpinner("Building backend...");
 * const result = await buildBackend();
 * stopSpinner(result.success, result.message);
 * ```
 */
export function stopSpinner(success: boolean, message?: string): void {
  if (!currentSpinner) return;

  if (success) {
    currentSpinner.succeed(message);
  } else {
    currentSpinner.fail(message);
  }

  currentSpinner = null;
}

/**
 * Update the current spinner's message
 *
 * @param message - The new message to display
 *
 * @example
 * ```typescript
 * startSpinner("Downloading...");
 * updateSpinner("Extracting...");
 * updateSpinner("Installing...");
 * stopSpinner(true, "Installation complete");
 * ```
 */
export function updateSpinner(message: string): void {
  if (currentSpinner) {
    currentSpinner.text = message;
  }
}

/**
 * Print the application banner
 *
 * @example
 * ```typescript
 * printBanner();
 * // Output:
 * //   ╔══════════════════════════════════════╗
 * //   ║     Ares Car Rental Setup        ║
 * //   ╚══════════════════════════════════════╝
 * ```
 */
export function printBanner(): void {
  console.log("");
  console.log(chalk.cyan("  ╔══════════════════════════════════════╗"));
  console.log(chalk.cyan("  ║") + chalk.bold("     Ares Car Rental Setup        ") + chalk.cyan("║"));
  console.log(chalk.cyan("  ╚══════════════════════════════════════╝"));
  console.log("");
}

/**
 * Print a summary of the setup with URLs and next steps
 *
 * @param backendUrl - The backend server URL
 * @param frontendUrl - The frontend server URL
 *
 * @example
 * ```typescript
 * printSummary("http://localhost:5000", "http://localhost:3000");
 * ```
 */
export function printSummary(backendUrl: string, frontendUrl: string): void {
  console.log("");
  console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.green.bold("  Setup Complete! 🎉"));
  console.log(chalk.green.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("");
  console.log("  Backend: ", chalk.cyan(backendUrl));
  console.log("  Frontend:", chalk.cyan(frontendUrl));
  console.log("  Swagger: ", chalk.cyan(`${backendUrl}/swagger`));
  console.log("");
  console.log(chalk.bold("Next steps:"));
  console.log("  1. Open", chalk.cyan(frontendUrl), "in your browser");
  console.log("  2. Check backend/.env for demo credentials");
  console.log("  3. Start developing!");
  console.log("");
}
