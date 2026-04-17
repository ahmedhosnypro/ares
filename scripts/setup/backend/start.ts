/**
 * Backend Start Module
 * Starts the .NET backend server
 */

import { logInfo, logSuccess, logError, logWarn, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface BackendProcess {
  process: ReturnType<typeof Bun.spawn>;
  url: string;
  pid: number;
}

let backendProcess: BackendProcess | null = null;

/**
 * Start the backend server
 */
export async function startBackend(port = 5000): Promise<BackendProcess | null> {
  logInfo("Starting backend server...");

  if (backendProcess) {
    logWarn("Backend is already running");
    return backendProcess;
  }

  // Load .env file
  const envVars = await loadBackendEnv();
  if (!envVars) {
    logError("Failed to load backend .env file");
    return null;
  }

  startSpinner("Launching .NET application...");

  try {
    // Start the backend process with loaded environment variables
    const proc = Bun.spawn(
      ["dotnet", "run", "--project", "backend/Api", "--no-build", "--urls", `http://localhost:${String(port)}`],
      {
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          ...envVars,
          ASPNETCORE_ENVIRONMENT: "Development",
        },
      }
    );

    const url = `http://localhost:${String(port)}`;

    // Wait for the server to start
    const started = await waitForBackendStart(proc, url);

    if (!started) {
      stopSpinner(false, "Backend failed to start");
      proc.kill();
      return null;
    }

    stopSpinner(true, `Backend started at ${url}`);

    backendProcess = {
      process: proc,
      url,
      pid: proc.pid,
    };

    return backendProcess;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Failed to start backend");
    logError(`Start error: ${errorMessage}`);
    return null;
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
 * Wait for backend to start by monitoring output
 */
async function waitForBackendStart(proc: ReturnType<typeof Bun.spawn>, _url: string): Promise<boolean> {
  const timeout = 60000; // 60 seconds
  const startTime = Date.now();

  try {
    if (!proc.stdout || typeof proc.stdout === "number") {
      logDebug("Cannot read stdout");
      return false;
    }

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    while (Date.now() - startTime < timeout) {
      const { value, done } = await reader.read();

      if (done) {
        logDebug("Backend process ended unexpectedly");
        return false;
      }

      const chunk = decoder.decode(value);
      logDebug(chunk);

      // Look for startup completion indicators
      if (
        chunk.includes("Now listening on:") ||
        chunk.includes("Application started") ||
        chunk.includes("Content root path:")
      ) {
        // Give it a moment to fully initialize
        await Bun.sleep(2000);
        return true;
      }

      // Check for errors - only real fatal errors, not warnings
      if (
        chunk.includes("Unhandled exception") ||
        chunk.includes("Application startup exception") ||
        chunk.includes("Failed to bind to address") ||
        chunk.includes("FATAL")
      ) {
        logError("Backend startup error detected in logs");
        logDebug(chunk);
      }

      await Bun.sleep(100);
    }

    logWarn("Backend startup timeout");
    return false;
  } catch (error) {
    logDebug(`Error waiting for backend: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Stop the backend server
 */
export async function stopBackend(): Promise<boolean> {
  if (!backendProcess) {
    logDebug("Backend is not running");
    return true;
  }

  logInfo("Stopping backend server...");

  try {
    // Try graceful shutdown first
    backendProcess.process.kill();

    // Wait for process to exit
    await Bun.sleep(5000);

    // Force kill if still running
    try {
      backendProcess.process.kill(9);
    } catch {
      // Process already exited
    }

    backendProcess = null;
    logSuccess("Backend stopped");
    return true;
  } catch (error) {
    logError(`Failed to stop backend: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Get the current backend process
 */
export function getBackendProcess(): BackendProcess | null {
  return backendProcess;
}

/**
 * Check if backend is running
 */
export function isBackendRunning(): boolean {
  return backendProcess !== null;
}

/**
 * Start backend and wait for it to be ready
 */
export async function setupBackendServer(port = 5000): Promise<string | null> {
  logInfo("Setting up backend server...");
  logInfo("");

  const process = await startBackend(port);

  if (!process) {
    logError("Failed to start backend server");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check if port 5000 is already in use");
    logInfo("  2. Verify the backend build completed successfully");
    logInfo("  3. Check backend logs for errors");
    logInfo("  4. Try running manually: cd backend/Api && dotnet run");
    logInfo("");
    return null;
  }

  logInfo("");
  logSuccess(`Backend server is running at ${process.url}`);
  logInfo(`Process ID: ${String(process.pid)}`);
  logInfo("");

  return process.url;
}
