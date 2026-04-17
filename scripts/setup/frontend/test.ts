/**
 * Frontend Test Module
 * Tests frontend health endpoints and page accessibility
 */

import { logInfo, logSuccess, logError, logWarn, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface FrontendHealthResult {
  success: boolean;
  status?: string;
  version?: string;
  timestamp?: string;
  error?: string;
}

export interface FrontendTestResult {
  success: boolean;
  endpoints: {
    homepage: boolean;
    health: boolean;
  };
  errors: string[];
}

/**
 * Wait for URL to respond
 */
async function waitForUrl(url: string, timeout = 120000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok || response.status === 404) {
        // 404 is ok, means server is responding
        return true;
      }
    } catch {
      // Server not ready yet
    }

    await Bun.sleep(1000);
  }

  return false;
}

/**
 * Test frontend health endpoint
 */
export async function testFrontendHealth(baseUrl: string): Promise<FrontendHealthResult> {
  logDebug("Testing frontend health endpoint...");

  try {
    const response = await fetch(`${baseUrl}/api/health`);

    if (!response.ok) {
      return {
        success: false,
        error: `Health endpoint returned ${String(response.status)}`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      success: true,
      status: typeof data.status === "string" ? data.status : "unknown",
      version: typeof data.version === "string" ? data.version : "unknown",
      timestamp: typeof data.timestamp === "string" ? data.timestamp : "unknown",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
    };
  }
}

/**
 * Test homepage
 */
async function testHomepage(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(baseUrl);

    if (!response.ok) {
      return false;
    }

    // Check if it's HTML
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      return false;
    }

    // Check if page contains expected content
    const html = await response.text();
    return html.includes("<!DOCTYPE html>") || html.includes("<html");
  } catch {
    return false;
  }
}

/**
 * Test all frontend endpoints
 */
export async function testFrontendEndpoints(baseUrl: string): Promise<FrontendTestResult> {
  logInfo("Testing frontend endpoints...");

  const result: FrontendTestResult = {
    success: true,
    endpoints: {
      homepage: false,
      health: false,
    },
    errors: [],
  };

  // Test homepage
  startSpinner("Testing homepage...");
  result.endpoints.homepage = await testHomepage(baseUrl);
  if (result.endpoints.homepage) {
    stopSpinner(true, `Homepage: ${baseUrl} ✓`);
  } else {
    stopSpinner(false, `Homepage: ${baseUrl} ✗`);
    result.errors.push("Homepage not accessible");
    result.success = false;
  }

  // Test health endpoint
  startSpinner("Testing health endpoint...");
  const healthResult = await testFrontendHealth(baseUrl);
  result.endpoints.health = healthResult.success;
  if (healthResult.success) {
    stopSpinner(true, `Health endpoint: ${baseUrl}/api/health ✓`);
    if (healthResult.status) {
      logInfo(`  Status: ${healthResult.status}`);
    }
    if (healthResult.version) {
      logInfo(`  Version: ${healthResult.version}`);
    }
  } else {
    stopSpinner(false, `Health endpoint: ${baseUrl}/api/health ✗`);
    result.errors.push(`Health endpoint error: ${healthResult.error ?? "Unknown error"}`);
    // Health endpoint is optional, don't fail the whole test
  }

  return result;
}

/**
 * Verify frontend is accessible
 */
export async function verifyFrontendAccessibility(baseUrl: string): Promise<boolean> {
  logInfo("Verifying frontend accessibility...");
  logInfo("");

  // Wait for frontend to respond
  startSpinner("Waiting for frontend to respond...");
  const isReady = await waitForUrl(baseUrl);

  if (!isReady) {
    stopSpinner(false, "Frontend did not respond in time");
    logError("Frontend is not accessible");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check if the frontend process is running");
    logInfo("  2. Verify the port is not blocked by firewall");
    logInfo("  3. Check frontend logs for errors");
    logInfo("  4. Try accessing manually: open " + baseUrl);
    logInfo("");
    return false;
  }

  stopSpinner(true, "Frontend is responding");
  logInfo("");

  // Test endpoints
  const testResult = await testFrontendEndpoints(baseUrl);

  logInfo("");

  if (testResult.success) {
    logSuccess("Frontend is fully accessible!");
    logInfo("");
    logInfo("Available pages:");
    logInfo(`  - Homepage: ${baseUrl}`);
    if (testResult.endpoints.health) {
      logInfo(`  - Health: ${baseUrl}/api/health`);
    }
    return true;
  }

  logWarn("Frontend is partially accessible");
  if (testResult.errors.length > 0) {
    logInfo("");
    logInfo("Issues found:");
    for (const error of testResult.errors) {
      logWarn(`  - ${error}`);
    }
  }

  // As long as homepage works, we're good
  return testResult.endpoints.homepage;
}
