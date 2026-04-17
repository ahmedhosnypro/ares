/**
 * Frontend Start Module
 * Starts the Next.js development server
 */

import { logInfo, logSuccess, logError, logWarn, logDebug, startSpinner, stopSpinner } from "../lib/logger";

export interface FrontendProcess {
  process: ReturnType<typeof Bun.spawn>;
  url: string;
  pid: number;
}

let frontendProcess: FrontendProcess | null = null;

/**
 * Start the frontend development server
 */
export async function startFrontend(
  port = 3000,
  backendUrl = "http://localhost:5000"
): Promise<FrontendProcess | null> {
  logInfo("Starting frontend development server...");

  if (frontendProcess) {
    logWarn("Frontend is already running");
    return frontendProcess;
  }

  startSpinner("Launching Next.js dev server...");

  try {
    // Start the frontend process
    const proc = Bun.spawn(["bun", "run", "dev"], {
      cwd: "frontend",
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PORT: String(port),
        NEXT_PUBLIC_API_BASE_URL: backendUrl,
      },
    });

    const url = `http://localhost:${String(port)}`;

    // Wait for the server to start
    const started = await waitForFrontendStart(proc, url);

    if (!started) {
      stopSpinner(false, "Frontend failed to start");
      proc.kill();
      return null;
    }

    stopSpinner(true, `Frontend started at ${url}`);

    frontendProcess = {
      process: proc,
      url,
      pid: proc.pid,
    };

    return frontendProcess;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stopSpinner(false, "Failed to start frontend");
    logError(`Start error: ${errorMessage}`);
    return null;
  }
}

/**
 * Wait for frontend to start by monitoring output
 */
async function waitForFrontendStart(proc: ReturnType<typeof Bun.spawn>, _url: string): Promise<boolean> {
  const timeout = 120000; // 120 seconds (Next.js can take a while)
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
        logDebug("Frontend process ended unexpectedly");
        return false;
      }

      const chunk = decoder.decode(value);
      logDebug(chunk);

      // Look for startup completion indicators
      if (
        chunk.includes("Ready in") ||
        chunk.includes("Local:") ||
        chunk.includes("started server on") ||
        chunk.includes("compiled successfully")
      ) {
        // Give it a moment to fully initialize
        await Bun.sleep(3000);
        return true;
      }

      // Check for errors
      if (chunk.includes("Error:") || chunk.includes("failed") || chunk.includes("EADDRINUSE")) {
        logError("Frontend startup error detected in logs");
        logDebug(chunk);
      }

      await Bun.sleep(100);
    }

    logWarn("Frontend startup timeout");
    return false;
  } catch (error) {
    logDebug(`Error waiting for frontend: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Stop the frontend server
 */
export async function stopFrontend(): Promise<boolean> {
  if (!frontendProcess) {
    logDebug("Frontend is not running");
    return true;
  }

  logInfo("Stopping frontend server...");

  try {
    // Try graceful shutdown first
    frontendProcess.process.kill();

    // Wait for process to exit
    await Bun.sleep(5000);

    // Force kill if still running
    try {
      frontendProcess.process.kill(9);
    } catch {
      // Process already exited
    }

    frontendProcess = null;
    logSuccess("Frontend stopped");
    return true;
  } catch (error) {
    logError(`Failed to stop frontend: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Get the current frontend process
 */
export function getFrontendProcess(): FrontendProcess | null {
  return frontendProcess;
}

/**
 * Check if frontend is running
 */
export function isFrontendRunning(): boolean {
  return frontendProcess !== null;
}

/**
 * Start frontend and wait for it to be ready
 */
export async function setupFrontendServer(port = 3000, backendUrl = "http://localhost:5000"): Promise<string | null> {
  logInfo("Setting up frontend server...");
  logInfo("");

  const process = await startFrontend(port, backendUrl);

  if (!process) {
    logError("Failed to start frontend server");
    logInfo("");
    logInfo("Troubleshooting steps:");
    logInfo("  1. Check if port 3000 is already in use");
    logInfo("  2. Verify dependencies are installed");
    logInfo("  3. Check frontend logs for errors");
    logInfo("  4. Try running manually: cd frontend && bun run dev");
    logInfo("");
    return null;
  }

  logInfo("");
  logSuccess(`Frontend server is running at ${process.url}`);
  logInfo(`Process ID: ${String(process.pid)}`);
  logInfo("");

  return process.url;
}
