/**
 * Port Availability Check Module
 * Checks if required ports are available using multiple fallback methods
 */

import { $ } from "bun";
import { logDebug, logInfo, logWarn, logError } from "../lib/logger";
import { askYesNo } from "../lib/utils";

export interface PortInfo {
  port: number;
  available: boolean;
  processInfo?: string;
}

/**
 * Check if a port is available using multiple methods
 */
export async function checkPort(port: number): Promise<PortInfo> {
  logDebug(`Checking if port ${port.toString()} is available...`);

  const methods = [
    () => checkPortWithLsof(port),
    () => checkPortWithNetstat(port),
    () => checkPortWithSs(port),
    () => checkPortWithFuser(port),
    () => checkPortWithSocket(port),
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result !== null) {
        logDebug(`Port ${port.toString()} check result: ${result.available ? "available" : "in use"}`);
        return result;
      }
    } catch (_error) {
      logDebug(`Port check method failed: ${_error instanceof Error ? _error.message : "Unknown error"}`);
    }
  }

  logDebug(`All port check methods failed for port ${port.toString()}, assuming available`);
  return { port, available: true };
}

/**
 * Check port using lsof (Linux/macOS)
 */
async function checkPortWithLsof(port: number): Promise<PortInfo | null> {
  try {
    const result = await $`lsof -ti:${port.toString()}`.text();
    const pids = result.trim().split("\n").filter(Boolean);

    if (pids.length > 0) {
      const pid = pids[0] ?? "";
      let processInfo = `PID ${pid}`;

      try {
        const procName = await $`ps -p ${pid} -o comm=`.text();
        processInfo = `PID ${pid} (${procName.trim()})`;
      } catch {
        // Couldn't get process name
      }

      return { port, available: false, processInfo };
    }

    return { port, available: true };
  } catch {
    return null;
  }
}

/**
 * Check port using netstat (Linux/Windows/macOS)
 */
async function checkPortWithNetstat(port: number): Promise<PortInfo | null> {
  try {
    let result: string;

    try {
      if (process.platform === "win32") {
        // On Windows, use -ano to get the PID and avoid DNS resolution (faster)
        result = await $`netstat -ano`.text();
      } else {
        // cspell:disable-next-line
        result = await $`netstat -tuln`.text();
      }
    } catch {
      try {
        result = await $`netstat -an`.text();
      } catch {
        return null;
      }
    }

    const lines = result.split("\n");
    for (const line of lines) {
      if (line.includes(`:${port.toString()}`) || line.includes(`.${port.toString()}`)) {
        if (line.includes("LISTEN") || line.includes("LISTENING")) {
          return { port, available: false, processInfo: line.trim() };
        }
      }
    }

    return { port, available: true };
  } catch {
    return null;
  }
}

/**
 * Check port using ss (modern Linux)
 */
async function checkPortWithSs(port: number): Promise<PortInfo | null> {
  try {
    // cspell:disable-next-line
    const result = await $`ss -tuln`.text();
    const lines = result.split("\n");

    for (const line of lines) {
      if (line.includes(`:${port.toString()}`) && line.includes("LISTEN")) {
        return { port, available: false, processInfo: line.trim() };
      }
    }

    return { port, available: true };
  } catch {
    return null;
  }
}

/**
 * Check port using fuser (Linux)
 */
async function checkPortWithFuser(port: number): Promise<PortInfo | null> {
  try {
    // cspell:disable-next-line
    const result = await $`fuser ${port.toString()}/tcp`.text();
    const pids = result.trim().split(/\s+/).filter(Boolean);

    if (pids.length > 0) {
      return { port, available: false, processInfo: `PID ${pids.join(", ")}` };
    }

    return { port, available: true };
  } catch {
    return null;
  }
}

/**
 * Check port by attempting to bind to it (universal fallback)
 */
function checkPortWithSocket(port: number): Promise<PortInfo | null> {
  return new Promise(resolve => {
    try {
      const server = Bun.serve({
        port,
        fetch() {
          return new Response("test");
        },
      });

      void server.stop();
      resolve({ port, available: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";

      if (errorMessage.includes("EADDRINUSE") || errorMessage.includes("address already in use")) {
        resolve({ port, available: false, processInfo: "Port in use (detected via socket binding)" });
      } else {
        resolve(null);
      }
    }
  });
}

export async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    logInfo(`Attempting to kill process on port ${port.toString()}...`);

    // Try Windows specific method
    if (process.platform === "win32") {
      try {
        const result = await $`netstat -ano`.text();
        const lines = result.split("\n");
        const pids = new Set<string>();

        for (const line of lines) {
          if (line.includes(`:${port.toString()}`) && line.includes("LISTENING")) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !Number.isNaN(Number.parseInt(pid, 10))) {
              pids.add(pid);
            }
          }
        }

        for (const pid of pids) {
          logInfo(`Killing process with PID ${pid}...`);
          try {
            await $`taskkill /F /PID ${pid}`.quiet();
          } catch (err) {
            logWarn(`Failed to kill process ${pid}: ${err instanceof Error ? err.message : "Unknown error"}`);
          }
        }

        if (pids.size > 0) {
          await Bun.sleep(1500); // Wait slightly longer for Windows to free the port
          const check = await checkPort(port);
          return check.available;
        }
      } catch (error) {
        logDebug(`Windows kill failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Try lsof (Linux/macOS)
    try {
      const pids = await $`lsof -ti:${port.toString()}`.text();
      const pidList = pids.trim().split("\n").filter(Boolean);

      for (const pid of pidList) {
        try {
          await $`kill -9 ${pid}`.quiet();
          logInfo(`Killed process ${pid}`);
        } catch {
          logWarn(`Failed to kill process ${pid}`);
        }
      }

      await Bun.sleep(1000);
      const check = await checkPort(port);
      return check.available;
    } catch {
      // lsof not available
    }

    // Try fuser (Linux)
    try {
      // cspell:disable-next-line
      await $`fuser -k ${port.toString()}/tcp`.quiet();
      await Bun.sleep(1000);

      const check = await checkPort(port);
      return check.available;
    } catch {
      // fuser not available
    }

    logError(`Failed to kill process on port ${port.toString()}`);
    return false;
  } catch {
    logError(`Failed to kill process on port ${port.toString()}`);
    return false;
  }
}

export async function showPortStatus(info: PortInfo, serviceName: string): Promise<boolean> {
  if (info.available) {
    logInfo(`Port ${info.port.toString()} is available for ${serviceName} ✓`);
    return true;
  }

  logWarn(`Port ${info.port.toString()} is already in use (needed for ${serviceName})`);
  if (info.processInfo) {
    logInfo(`Process using port: ${info.processInfo}`);
  }

  const shouldKill = await askYesNo(`Kill the process using port ${info.port.toString()}?`, false);

  if (shouldKill) {
    const killed = await killProcessOnPort(info.port);
    if (killed) {
      logInfo(`Port ${info.port.toString()} is now available ✓`);
      return true;
    } else {
      logError(`Failed to free port ${info.port.toString()}`);
      return false;
    }
  }

  const shouldContinue = await askYesNo("Continue anyway? (May cause issues)", false);
  return shouldContinue;
}

export async function checkRequiredPorts(): Promise<{
  backend: PortInfo;
  frontend: PortInfo;
  sqlServer: PortInfo;
}> {
  const backend = await checkPort(5000);
  const frontend = await checkPort(3000);
  const sqlServer = await checkPort(1433);

  return { backend, frontend, sqlServer };
}
