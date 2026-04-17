/**
 * Frontend Stop Module
 * Stops the frontend server and cleans up
 */

import { logInfo, logSuccess, logError, logDebug } from "../lib/logger";
import { stopFrontend, getFrontendProcess } from "./start";

/**
 * Stop frontend server gracefully
 */
export async function stopFrontendServer(): Promise<boolean> {
  const process = getFrontendProcess();

  if (!process) {
    logDebug("Frontend is not running");
    return true;
  }

  logInfo("Stopping frontend server...");
  logInfo(`  URL: ${process.url}`);
  logInfo(`  PID: ${String(process.pid)}`);
  logInfo("");

  const stopped = await stopFrontend();

  if (stopped) {
    logSuccess("Frontend server stopped successfully");
    return true;
  }

  logError("Failed to stop frontend server");
  return false;
}

/**
 * Cleanup frontend resources
 */
export async function cleanupFrontend(): Promise<void> {
  logDebug("Cleaning up frontend resources...");

  // Stop the server if running
  await stopFrontendServer();

  // Additional cleanup can be added here
  // - Remove .next build cache
  // - Clean up temp files
  // - etc.

  logDebug("Frontend cleanup completed");
}
