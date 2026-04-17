/**
 * Bun Check Module
 * Checks for Bun installation and version
 */

import { logDebug, logInfo } from "../lib/logger";

export interface BunInfo {
  installed: boolean;
  version: string;
}

export function checkBun(): BunInfo {
  logDebug("Checking for Bun...");

  // We're running with Bun, so it's definitely installed
  const version = Bun.version;

  logDebug(`Bun version: ${version}`);

  return {
    installed: true,
    version,
  };
}

export function isVersionCompatible(version: string): boolean {
  // Check if version is 1.0 or higher
  const majorVersion = parseInt(version.split(".")[0] ?? "0", 10);
  return majorVersion >= 1;
}

export function getBunInstallInstructions(osType: string): string {
  switch (osType) {
    case "linux":
    case "darwin":
      return `
Install Bun on ${osType === "darwin" ? "macOS" : "Linux"}:

curl -fsSL https://bun.sh/install | bash

Then restart your terminal.
`;

    case "windows":
      return `
Install Bun on Windows:

powershell -c "irm bun.sh/install.ps1|iex"

Then restart your terminal.
`;

    default:
      return "Visit https://bun.sh to install Bun";
  }
}

export function showBunStatus(info: BunInfo): void {
  if (!isVersionCompatible(info.version)) {
    logInfo(`Bun ${info.version} is installed, but version 1.0+ is recommended`);
    return;
  }

  logInfo(`Bun ${info.version} is installed ✓`);
}
