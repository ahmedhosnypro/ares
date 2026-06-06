/**
 * ngrok Check Module
 * Checks for ngrok installation
 */

import { $ } from "bun";
import { logDebug, logInfo, logError } from "../lib/logger";

export interface NgrokInfo {
  installed: boolean;
  version: string;
}

export async function checkNgrok(): Promise<NgrokInfo> {
  logDebug("Checking for ngrok...");

  try {
    const process = Bun.spawn(["ngrok", "--version"]);
    const output = await new Response(process.stdout).text();
    const version = output.trim().replace("ngrok version ", "");

    logDebug(`ngrok version: ${version}`);

    return {
      installed: true,
      version,
    };
  } catch (_error) {
    logDebug("ngrok not found");
    return {
      installed: false,
      version: "",
    };
  }
}

/**
 * Install ngrok using winget (Windows only)
 */
export async function installNgrok(): Promise<boolean> {
  if (process.platform !== "win32") {
    logDebug("ngrok installation is currently only supported via winget on Windows");
    return false;
  }

  try {
    // Check if winget exists using a shell command
    const wingetCheck = await $`where.exe winget`.quiet();
    if (wingetCheck.exitCode !== 0) {
      logError("winget not found, cannot install ngrok automatically");
      return false;
    }

    logInfo("Installing ngrok via winget...");

    // Install ngrok using cmd /c to ensure execution aliases are correctly resolved
    const installProc = Bun.spawn([
      "cmd.exe",
      "/c",
      "winget",
      "install",
      "Ngrok.Ngrok",
      "--silent",
      "--accept-source-agreements",
      "--accept-package-agreements",
    ]);
    await installProc.exited;

    if (installProc.exitCode === 0) {
      logInfo("ngrok installed successfully via winget");
      return true;
    } else {
      logError(`winget install failed with exit code ${String(installProc.exitCode)}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to install ngrok: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

export function getNgrokInstallInstructions(): string {
  return `
Install ngrok:

1. Download from: https://ngrok.com/download
2. Sign up for a free account
3. Connect your account: ngrok config add-authtoken YOUR_AUTH_TOKEN
`;
}

export function showNgrokStatus(info: NgrokInfo): void {
  if (info.installed) {
    logInfo(`ngrok ${info.version} is installed ✓`);
  } else {
    logInfo("ngrok is not installed (optional, needed for Paymob webhooks)");
  }
}
