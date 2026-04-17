/**
 * .NET SDK Check Module
 * Checks for .NET SDK installation and version
 */

import { $ } from "bun";
import { logDebug, logInfo, logWarn, logError } from "../lib/logger";
import { commandExists } from "../lib/utils";

export interface DotnetInfo {
  installed: boolean;
  version?: string;
  efToolInstalled: boolean;
  scriptToolInstalled: boolean;
}

export async function checkDotnet(): Promise<DotnetInfo> {
  logDebug("Checking for .NET SDK...");

  const dotnetExists = await commandExists("dotnet");

  if (!dotnetExists) {
    return {
      installed: false,
      efToolInstalled: false,
      scriptToolInstalled: false,
    };
  }

  try {
    // Get .NET version
    const versionOutput = await $`dotnet --version`.text();
    const version = versionOutput.trim();

    logDebug(`.NET SDK version: ${version}`);

    // Check for dotnet ef tool
    const efToolInstalled = await checkDotnetEfTool();
    const scriptToolInstalled = await checkDotnetScriptTool();

    return {
      installed: true,
      version,
      efToolInstalled,
      scriptToolInstalled,
    };
  } catch (error) {
    logDebug(`Error checking .NET: ${error instanceof Error ? error.message : "Unknown error"}`);
    return {
      installed: false,
      efToolInstalled: false,
      scriptToolInstalled: false,
    };
  }
}

async function checkDotnetEfTool(): Promise<boolean> {
  try {
    const toolListOutput = await $`dotnet tool list --global`.text();
    return toolListOutput.includes("dotnet-ef");
  } catch {
    return false;
  }
}

async function checkDotnetScriptTool(): Promise<boolean> {
  try {
    const toolListOutput = await $`dotnet tool list --global`.text();
    return toolListOutput.includes("dotnet-script");
  } catch {
    return false;
  }
}

export async function installDotnetEfTool(): Promise<boolean> {
  try {
    logInfo("Installing dotnet-ef tool...");
    await $`dotnet tool install --global dotnet-ef`.quiet();
    logInfo("dotnet-ef tool installed successfully");
    return true;
  } catch (error) {
    logError(`Failed to install dotnet-ef: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

export async function installDotnetScriptTool(): Promise<boolean> {
  try {
    logInfo("Installing dotnet-script tool...");
    await $`dotnet tool install --global dotnet-script`.quiet();
    logInfo("dotnet-script tool installed successfully");
    return true;
  } catch (error) {
    logError(`Failed to install dotnet-script: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

export function getDotnetInstallInstructions(osType: string): string {
  const baseUrl = "https://dotnet.microsoft.com/download";

  switch (osType) {
    case "linux":
      return `
Install .NET SDK 10.0 on Linux:

1. Visit: ${baseUrl}
2. Or use package manager:
   
   Ubuntu/Debian:
   wget https://dot.net/v1/dotnet-install.sh
   chmod +x dotnet-install.sh
   ./dotnet-install.sh --channel 10.0
   
   Fedora/RHEL:
   sudo dnf install dotnet-sdk-10.0
`;

    case "darwin":
      return `
Install .NET SDK 10.0 on macOS:

1. Visit: ${baseUrl}
2. Or use Homebrew:
   brew install --cask dotnet-sdk
`;

    case "windows":
      return `
Install .NET SDK 10.0 on Windows:

1. Visit: ${baseUrl}
2. Download and run the installer
3. Restart your terminal after installation
`;

    default:
      return `Visit ${baseUrl} to download .NET SDK 10.0`;
  }
}

export function isVersionCompatible(version: string): boolean {
  // Check if version is 10.x or higher
  const majorVersion = parseInt(version.split(".")[0] ?? "0", 10);
  return majorVersion >= 10;
}

export function showDotnetStatus(info: DotnetInfo, osType: string): void {
  if (!info.installed) {
    logError(".NET SDK is not installed");
    logWarn(getDotnetInstallInstructions(osType));
    return;
  }

  if (info.version && !isVersionCompatible(info.version)) {
    logWarn(`.NET SDK ${info.version} is installed, but version 10.0 or higher is required`);
    logWarn(getDotnetInstallInstructions(osType));
    return;
  }

  logInfo(`.NET SDK ${info.version ?? "unknown"} is installed ✓`);

  if (!info.efToolInstalled) {
    logWarn("dotnet-ef tool is not installed");
    logInfo("Run: dotnet tool install --global dotnet-ef");
  } else {
    logInfo("dotnet-ef tool is installed ✓");
  }

  if (!info.scriptToolInstalled) {
    logWarn("dotnet-script tool is not installed");
    logInfo("Run: dotnet tool install --global dotnet-script");
  } else {
    logInfo("dotnet-script tool is installed ✓");
  }
}
