/**
 * OS Detection Module
 * Detects operating system, architecture, and environment
 */

import { logDebug } from "../lib/logger";

export interface SystemInfo {
  osType: "windows" | "linux" | "darwin" | "unknown";
  arch: string;
  isDocker: boolean;
  isDevcontainer: boolean;
}

export async function detectOS(): Promise<SystemInfo> {
  const osType = getOSType();
  const arch = process.arch;
  const isDocker = await checkIfDocker();
  const isDevcontainer = checkIfDevcontainer();

  logDebug(
    `Detected OS: ${osType}, Arch: ${arch}, Docker: ${String(isDocker)}, Devcontainer: ${String(isDevcontainer)}`
  );

  return {
    osType,
    arch,
    isDocker,
    isDevcontainer,
  };
}

function getOSType(): "windows" | "linux" | "darwin" | "unknown" {
  const platform = process.platform;

  if (platform === "win32") return "windows";
  if (platform === "linux") return "linux";
  if (platform === "darwin") return "darwin";

  return "unknown";
}

async function checkIfDocker(): Promise<boolean> {
  try {
    // Check for .dockerenv file
    const dockerEnvFile = Bun.file("/.dockerenv");
    if (dockerEnvFile.size > 0) return true;
  } catch {
    // File doesn't exist
  }

  try {
    // Check /proc/1/cgroup for docker
    const cgroupFile = Bun.file("/proc/1/cgroup");
    const content = await cgroupFile.text();
    if (content.includes("docker")) return true;
  } catch {
    // File doesn't exist or can't be read
  }

  return false;
}

function checkIfDevcontainer(): boolean {
  // Check for devcontainer environment variables
  return (
    process.env.REMOTE_CONTAINERS === "true" ||
    process.env.CODESPACES === "true" ||
    process.env.VSCODE_REMOTE_CONTAINERS_SESSION !== undefined ||
    process.env.DOTNET_RUNNING_IN_CONTAINER === "true"
  );
}

export function isSupportedOS(osType: string): boolean {
  return osType === "linux" || osType === "darwin" || osType === "windows";
}

export function getOSDisplayName(osType: string): string {
  switch (osType) {
    case "linux":
      return "Linux";
    case "darwin":
      return "macOS";
    case "windows":
      return "Windows";
    default:
      return "Unknown";
  }
}
