import { $ } from "bun";
import prompts from "prompts";

export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await $`which ${command}`.quiet();
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
  const response = await prompts({
    type: "confirm",
    name: "value",
    message,
    initial,
  });

  return (response.value as boolean | undefined) ?? initial;
}

export async function askInput(message: string, initial?: string): Promise<string> {
  const response = await prompts({
    type: "text",
    name: "value",
    message,
    initial,
  });

  return (response.value as string | undefined) ?? initial ?? "";
}

export async function askPassword(message: string): Promise<string> {
  const response = await prompts({
    type: "password",
    name: "value",
    message,
  });

  return (response.value as string | undefined) ?? "";
}

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
