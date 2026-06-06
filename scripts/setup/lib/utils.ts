import { $ } from "bun";
import prompts, { type PromptObject, type Options } from "prompts";
import * as os from "node:os";
import * as path from "node:path";
import { logWarn } from "./logger";

// Auto-inject .dotnet/tools path for Windows users if not present
if (process.platform === "win32") {
  const dotnetToolsPath = path.join(os.homedir(), ".dotnet", "tools");
  const currentPath = process.env.PATH || process.env.Path || "";
  if (!currentPath.includes(dotnetToolsPath)) {
    const delimiter = ";";
    if (process.env.PATH !== undefined) {
      process.env.PATH = `${dotnetToolsPath}${delimiter}${currentPath}`;
    }
    if (process.env.Path !== undefined) {
      process.env.Path = `${dotnetToolsPath}${delimiter}${currentPath}`;
    }
  }
}

/**
 * Type-safe wrapper for prompts to avoid ESLint "unsafe call" errors
 * and handle Ctrl+C globally.
 */
async function ask<T extends string = string>(
  questions: PromptObject | PromptObject[],
  options?: Options
): Promise<prompts.Answers<T>> {
  const response = (await (prompts as unknown as (
    q: PromptObject | PromptObject[],
    o?: Options
  ) => Promise<prompts.Answers<T>>)(questions, options)) as Record<string, unknown>;

  // Handle Ctrl+C (prompts returns an empty object when cancelled)
  if (Object.keys(response).length === 0) {
    logWarn("\nSetup cancelled by user. Exiting...");
    process.exit(0);
  }

  return response as prompts.Answers<T>;
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    const checkCommand = process.platform === "win32" ? "where.exe" : "which";
    const result = await $`${checkCommand} ${command}`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export function getOSType(): "windows" | "linux" | "darwin" | "unknown" {
  const platform = process.platform;
  if (platform === "win32") return "windows";
  if (platform === "linux") return "linux";
  if (platform === "darwin") return "darwin";
  return "unknown";
}

export function getArch(): string {
  return process.arch;
}

export async function askYesNo(message: string, initial = true): Promise<boolean> {
  const response = await ask({
    type: "confirm",
    name: "value",
    message,
    initial,
  });

  return (response.value as boolean | undefined) ?? initial;
}

export async function askInput(message: string, initial?: string): Promise<string> {
  const response = await ask({
    type: "text",
    name: "value",
    message,
    initial,
  });

  return (response.value as string | undefined) ?? initial ?? "";
}

export async function askPassword(message: string): Promise<string> {
  const response = await ask({
    type: "password",
    name: "value",
    message,
  });

  return (response.value as string | undefined) ?? "";
}

/**
 * Re-export the typed ask function for complex prompts
 */
export { ask as prompts };

export function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).slice(0, length);
}

export function generateSecureSecret(bytes = 64): string {
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes);
  return btoa(String.fromCharCode(...randomBytes));
}

export function isPortAvailable(port: number): boolean {
  try {
    const server = Bun.serve({
      port,
      fetch() {
        return new Response("test");
      },
    });
    void server.stop();
    return true;
  } catch {
    return false;
  }
}

export async function checkTcpPort(host: string, port: number, _timeoutMs = 2000): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: host,
      port,
      socket: {
        data() {},
        open() {},
        close() {},
        error() {},
      },
    });
    socket.end();
    return true;
  } catch {
    return false;
  }
}

export async function waitForPort(port: number, timeoutMs = 60000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${port.toString()}`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok || response.status < 500) {
        return true;
      }
    } catch {
      // Port not ready yet
    }

    await Bun.sleep(1000);
  }

  return false;
}

export async function waitForUrl(url: string, timeoutMs = 60000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // URL not ready yet
    }

    await Bun.sleep(1000);
  }

  return false;
}

export function sleep(ms: number): Promise<void> {
  return Bun.sleep(ms);
}

export async function fileExists(path: string): Promise<boolean> {
  const file = Bun.file(path);
  return await file.exists();
}

export async function backupFile(path: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${path}.backup.${timestamp}`;

  const file = Bun.file(path);
  if (await file.exists()) {
    await Bun.write(backupPath, file);
  }

  return backupPath;
}

/**
 * Parse a .env file content into a key-value record
 */
export function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index > 0) {
      const key = trimmed.substring(0, index).trim();
      const value = trimmed.substring(index + 1).trim();
      env[key] = value;
    }
  }

  return env;
}
