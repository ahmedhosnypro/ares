/**
 * Node.js Check Module
 * Checks for Node.js installation and version
 */

import { $ } from "bun";
import { logDebug, logInfo, logWarn } from "../lib/logger";
import { commandExists } from "../lib/utils";

export interface NodeInfo {
  installed: boolean;
  version?: string;
}

export async function checkNode(): Promise<NodeInfo> {
  logDebug("Checking for Node.js...");

  const nodeExists = await commandExists("node");

  if (!nodeExists) {
    return {
      installed: false,
    };
  }

  try {
    const versionOutput = await $`node --version`.text();
    const version = versionOutput.trim().replace("v", "");

    logDebug(`Node.js version: ${version}`);

    return {
      installed: true,
      version,
    };
  } catch (error) {
    logDebug(`Error checking Node.js: ${error instanceof Error ? error.message : "Unknown error"}`);
    return {
      installed: false,
    };
  }
}

export function isVersionCompatible(version: string): boolean {
  // Check if version is 18.x or higher
  const majorVersion = parseInt(version.split(".")[0] ?? "0", 10);
  return majorVersion >= 18;
}

export function getNodeInstallInstructions(osType: string): string {
  const baseUrl = "https://nodejs.org/";

  switch (osType) {
    case "linux":
      return `
Install Node.js 18+ on Linux:

1. Using nvm (recommended):
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20

2. Or visit: ${baseUrl}
`;

    case "darwin":
      return `
Install Node.js 18+ on macOS:

1. Using nvm (recommended):
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20

2. Or use Homebrew:
   brew install node

3. Or visit: ${baseUrl}
`;

    case "windows":
      return `
Install Node.js 18+ on Windows:

1. Visit: ${baseUrl}
2. Download and run the LTS installer
3. Restart your terminal after installation

Or use nvm-windows:
https://github.com/coreybutler/nvm-windows
`;

    default:
      return `Visit ${baseUrl} to download Node.js 18+`;
  }
}

export function showNodeStatus(info: NodeInfo, osType: string): void {
  if (!info.installed) {
    logWarn("Node.js is not installed (optional for frontend)");
    logInfo(getNodeInstallInstructions(osType));
    return;
  }

  if (info.version && !isVersionCompatible(info.version)) {
    logWarn(`Node.js ${info.version} is installed, but version 18+ is recommended`);
    logInfo(getNodeInstallInstructions(osType));
    return;
  }

  logInfo(`Node.js ${info.version ?? "unknown"} is installed ✓`);
}
