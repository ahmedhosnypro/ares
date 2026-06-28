import chalk from "chalk";
import ora, { type Ora } from "ora";
import { colors } from "./colors";

let currentSpinner: Ora | null = null;
let debugMode = false;

export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

export function logInfo(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.info("\u2139"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function logSuccess(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.success("\u2714"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function logError(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.error(colors.error("\u2716"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function logWarn(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.warn(colors.warn("\u26A0"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function logDebug(message: string): void {
  if (!debugMode) return;

  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log(colors.debug("\uD83D\uDC1B"), colors.dim(message));
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function logStep(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log("");
  console.log(colors.bold("\u2501\u2501\u2501"), colors.bold(message), colors.bold("\u2501\u2501\u2501"));
  console.log("");
}

export function logSubstep(message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  console.log("  ", colors.dim("\u2192"), message);
  if (currentSpinner) {
    currentSpinner.start();
  }
}

export function startSpinner(message: string): Ora {
  if (currentSpinner) {
    currentSpinner.stop();
  }
  currentSpinner = ora(message).start();
  return currentSpinner;
}

export function stopSpinner(success: boolean, message?: string): void {
  if (!currentSpinner) return;

  if (success) {
    currentSpinner.succeed(message);
  } else {
    currentSpinner.fail(message);
  }

  currentSpinner = null;
}

export function updateSpinner(message: string): void {
  if (currentSpinner) {
    currentSpinner.text = message;
  }
}

export function printBanner(): void {
  console.log("");
  console.log(
    chalk.cyan(
      "  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"
    )
  );
  console.log(chalk.cyan("  \u2551") + chalk.bold("     Ares Docs Generator        ") + chalk.cyan("\u2551"));
  console.log(
    chalk.cyan(
      "  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"
    )
  );
  console.log("");
}
