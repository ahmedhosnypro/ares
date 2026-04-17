/**
 * Backend Test Module
 * Tests backend health endpoints and API accessibility
 */

import { logInfo, logSuccess, logError, logWarn, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface HealthCheckResult {
  success: boolean;
  status?: string;
  version?: string;
  timestamp?: string;
  error?: string;
}

export interface ApiTestResult {
  success: boolean;
  endpoints: {
    root: boolean;
    health: boolean;
    swagger: boolean;
  };
  errors: string[];
}

/**
 * Wait for URL to respond
 */
async function waitForUrl(url: string, timeout = 60000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${url}/api/health`, { method: "GET" });
      // Any response means server is up (even 404, 405, 500)
      if (response.status < 600) {
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
 * Test backend health endpoint
 */
export async function testHealthEndpoint(baseUrl: string): Promise<HealthCheckResult> {
  logDebug("Testing health endpoint...");

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
 * Test root endpoint
 */
async function testRootEndpoint(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(baseUrl);
    // Any response is good (200, 404, etc.)
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Test Swagger endpoint
 */
async function testSwaggerEndpoint(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/swagger/index.html`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Test all backend endpoints
 */
export async function testBackendEndpoints(baseUrl: string): Promise<ApiTestResult> {
  logInfo("Testing backend endpoints...");

  const result: ApiTestResult = {
    success: true,
    endpoints: {
      root: false,
      health: false,
      swagger: false,
    },
    errors: [],
  };

  // Test root endpoint
  startSpinner("Testing root endpoint...");
  result.endpoints.root = await testRootEndpoint(baseUrl);
  if (result.endpoints.root) {
    stopSpinner(true, `Root endpoint: ${baseUrl} ✓`);
  } else {
    stopSpinner(false, `Root endpoint: ${baseUrl} ✗`);
    result.errors.push("Root endpoint not accessible");
    result.success = false;
  }

  // Test health endpoint
  startSpinner("Testing health endpoint...");
  const healthResult = await testHealthEndpoint(baseUrl);
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
    result.success = false;
  }

  // Test Swagger endpoint
  startSpinner("Testing Swagger UI...");
  result.endpoints.swagger = await testSwaggerEndpoint(baseUrl);
  if (result.endpoints.swagger) {
    stopSpinner(true, `Swagger UI: ${baseUrl}/swagger ✓`);
  } else {
    stopSpinner(false, `Swagger UI: ${baseUrl}/swagger ✗`);
    result.errors.push("Swagger UI not accessible");
    // Swagger is optional, don't fail the whole test
  }

  return result;
}

/**
 * Verify backend is accessible
 */
export async function verifyBackendAccessibility(baseUrl: string): Promise<boolean> {
  logInfo("Verifying backend accessibility...");
  logInfo("");

  // Wait for backend to respond
  startSpinner("Waiting for backend to respond...");
  const isReady = await waitForUrl(baseUrl);

  if (!isReady) {
    stopSpinner(false, "Backend did not respond in time");
    logError("Backend is not accessible");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check if the backend process is running");
    logInfo("  2. Verify the port is not blocked by firewall");
    logInfo("  3. Check backend logs for errors");
    logInfo("  4. Try accessing manually: curl " + baseUrl);
    logInfo("");
    return false;
  }

  stopSpinner(true, "Backend is responding");
  logInfo("");

  // Test endpoints
  const testResult = await testBackendEndpoints(baseUrl);

  logInfo("");

  if (testResult.success) {
    logSuccess("Backend is fully accessible!");
    logInfo("");
    logInfo("Available endpoints:");
    logInfo(`  - API: ${baseUrl}/api`);
    logInfo(`  - Health: ${baseUrl}/api/health`);
    if (testResult.endpoints.swagger) {
      logInfo(`  - Swagger: ${baseUrl}/swagger`);
    }
    return true;
  }

  logWarn("Backend is partially accessible");
  if (testResult.errors.length > 0) {
    logInfo("");
    logInfo("Issues found:");
    for (const error of testResult.errors) {
      logWarn(`  - ${error}`);
    }
  }

  return testResult.endpoints.root && testResult.endpoints.health;
}
