import { existsSync } from "node:fs";
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

interface MermaidCompileError {
  line: number;
  message: string;
}

export interface MermaidCompileResult {
  success: boolean;
  infrastructureError: boolean;
  errors: MermaidCompileError[];
}

const MMDC_TIMEOUT_MS = 30_000;

const CHROME_SEARCH_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChromePath(): string | null {
  const envChrome = process.env["CHROME_PATH"];
  if (envChrome && existsSync(envChrome)) return envChrome;

  for (const path of CHROME_SEARCH_PATHS) {
    if (existsSync(path)) return path;
  }

  try {
    const result = execSync("where chrome", { encoding: "utf-8", timeout: 5_000 }).trim();
    const firstLine = result.split("\n")[0]?.trim();
    if (firstLine && existsSync(firstLine)) return firstLine;
  } catch {
    // chrome not on PATH
  }

  return null;
}

function buildPuppeteerConfig(): string {
  const chromePath = findChromePath();
  const config: Record<string, unknown> = {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (chromePath) {
    config["executablePath"] = chromePath;
  }
  const tempConfigPath = join(tmpdir(), "mermaid-puppeteer-config.json");
  writeFileSync(tempConfigPath, JSON.stringify(config, null, 2), "utf-8");
  return tempConfigPath;
}

function extractParseErrors(stderr: string): MermaidCompileError[] {
  const errors: MermaidCompileError[] = [];
  const lines = stderr.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined) {
      i++;
      continue;
    }

    const errorMatch = line.match(/^(?:Error:\s*)?(?:Parse|Lexical) error on line (\d+)/);
    if (errorMatch) {
      const lineNum = parseInt(errorMatch[1] ?? "", 10);
      const messageParts: string[] = [];

      if (line.includes(".")) {
        const snippetMatch = line.match(/\.{3}(.+)$/);
        if (snippetMatch?.[1]) {
          messageParts.push(snippetMatch[1].trim());
        }
      }

      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (nextLine === undefined) break;
        if (nextLine.match(/^(?:Error:|Parser\.| {4}at )/)) break;
        const expectingMatch = nextLine.match(/^Expecting\s+.+/);
        const unrecognizedMatch = nextLine.match(/^Unrecognized\s+.+/);
        if (expectingMatch || unrecognizedMatch) {
          messageParts.push(nextLine.trim());
        }
        j++;
      }

      errors.push({
        line: lineNum,
        message: messageParts.length > 0 ? messageParts.join(" ") : "Syntax error",
      });

      i = j;
      continue;
    }

    i++;
  }

  if (errors.length === 0 && stderr.toLowerCase().includes("error")) {
    const genericMatch = stderr.match(/Error:\s*(.+?)(?:\n|$)/);
    if (genericMatch?.[1]) {
      errors.push({
        line: 0,
        message: genericMatch[1].trim(),
      });
    }
  }

  return errors;
}

function isInfrastructureError(stderr: string): boolean {
  const infraSignals = [
    "Failed to launch the browser process",
    "Puppeteer",
    "ICU data",
    "TROUBLESHOOTING: https://pptr.dev",
    "ENOENT",
    "ECONNREFUSED",
  ];
  return infraSignals.some(signal => stderr.includes(signal));
}

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "mermaid-compile-"));
}

function cleanupTempDir(tempDir: string): void {
  try {
    rmdirSync(tempDir, { recursive: true });
  } catch (_cleanupError) {
    // intentionally ignored
  }
}

export async function compileMermaidDiagram(
  content: string,
  compilerBin: string = "mmdc"
): Promise<MermaidCompileResult> {
  const tempDir = createTempDir();
  const inputFile = join(tempDir, "diagram.mmd");
  const outputFile = join(tempDir, "diagram.png");
  const puppeteerConfigPath = buildPuppeteerConfig();

  try {
    writeFileSync(inputFile, content, "utf-8");

    const proc = Bun.spawn(
      [compilerBin, "-i", inputFile, "-o", outputFile, "--puppeteerConfigFile", puppeteerConfigPath, "-q"],
      {
        stdout: "pipe",
        stderr: "pipe",
        timeout: MMDC_TIMEOUT_MS,
      }
    );

    const exitCode = await proc.exited;
    const stderr = await new Response(proc.stderr).text();

    if (exitCode === 0) {
      return { success: true, infrastructureError: false, errors: [] };
    }

    if (isInfrastructureError(stderr)) {
      return {
        success: false,
        infrastructureError: true,
        errors: [
          {
            line: 0,
            message: `mmdc infrastructure error: ${stderr.trim().split("\n")[0] ?? "unknown"}`,
          },
        ],
      };
    }

    const parseErrors = extractParseErrors(stderr);

    if (parseErrors.length === 0) {
      return {
        success: false,
        infrastructureError: false,
        errors: [
          {
            line: 0,
            message: stderr.trim() || `mmdc exited with code ${String(exitCode)}`,
          },
        ],
      };
    }

    return { success: false, infrastructureError: false, errors: parseErrors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("ENOENT") || message.includes("not found") || message.includes("spawn")) {
      return {
        success: false,
        infrastructureError: true,
        errors: [
          {
            line: 0,
            message: `mmdc not available: ${message}. Falling back to regex validation.`,
          },
        ],
      };
    }

    return {
      success: false,
      infrastructureError: true,
      errors: [
        {
          line: 0,
          message: `Compilation failed: ${message}`,
        },
      ],
    };
  } finally {
    try {
      unlinkSync(inputFile);
    } catch (_unlinkInputError) {
      // intentionally ignored
    }
    try {
      unlinkSync(outputFile);
    } catch (_unlinkOutputError) {
      // intentionally ignored
    }
    try {
      unlinkSync(puppeteerConfigPath);
    } catch (_unlinkConfigError) {
      // intentionally ignored
    }
    cleanupTempDir(tempDir);
  }
}

export async function isMmdcAvailable(compilerBin: string = "mmdc"): Promise<boolean> {
  try {
    const proc = Bun.spawn([compilerBin, "--version"], {
      stdout: "pipe",
      stderr: "pipe",
      timeout: 10_000,
    });
    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch (_versionCheckError) {
    return false;
  }
}
