/**
 * Backend Stop Module
 * Stops the backend server and cleans up
 */

import { logInfo, logSuccess, logError, logDebug } from "../lib/logger";
import { stopBackend, getBackendProcess } from "./start";

/**
 * Stop backend server gracefully
 */
export async function stopBackendServer(): Promise<boolean> {
  const process = getBackendProcess();

  if (!process) {
    logDebug("Backend is not running");
    return true;
  }

  logInfo("Stopping backend server...");
  logInfo(`  URL: ${process.url}`);
  logInfo(`  PID: ${String(process.pid)}`);
  logInfo("");

  const stopped = await stopBackend();

  if (stopped) {
    logSuccess("Backend server stopped successfully");
    return true;
  }

  logError("Failed to stop backend server");
  return false;
}

/**
 * Cleanup backend resources
 */
export async function cleanupBackend(): Promise<void> {
  logDebug("Cleaning up backend resources...");

  // Stop the server if running
  await stopBackendServer();

  // Additional cleanup can be added here
  // - Remove temp files
  // - Close database connections
  // - etc.

  logDebug("Backend cleanup completed");
}
