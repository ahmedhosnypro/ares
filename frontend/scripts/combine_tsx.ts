/**
 * @file combine_tsx.ts
 * @description Automatically finds all .ts and .tsx files in the project (excluding node_modules, .next, output dirs, and tsconfig excludes)
 * and combines them into size-limited chunks (default 10MB) for processing by Large Language Models like Gemini.
 * Each file section is wrapped with clear START/END markers including the full file path.
 *
 * @usage bun run scripts/combine_tsx.ts
 */
import { Glob, write, file } from "bun";
import { mkdir, existsSync } from "node:fs";
import { join } from "node:path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit per combined file
const OUTPUT_DIR = "combined_chunks";
const PROJECT_ROOT = process.cwd();

async function run() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdir(OUTPUT_DIR, { recursive: true }, err => {
      if (err) throw err;
    });
  }

  let excludePatterns: string[] = [];
  try {
    const tsconfigPath = join(PROJECT_ROOT, "tsconfig.json");
    if (existsSync(tsconfigPath)) {
      const tsconfigContent = await file(tsconfigPath).text();
      // Robust regex to remove comments from JSONC while respecting strings
      const cleanJson = tsconfigContent.replace(/\\"|"(?:\\"|[^"])*"|(\/\*[\s\S]*?\*\/|\/\/.+)/g, (match, g1) =>
        g1 ? "" : match
      );
      // Remove trailing commas
      const finalJson = cleanJson.replace(/,(\s*[\]}])/g, "$1");
      const tsconfig = JSON.parse(finalJson) as { exclude?: string[] };
      excludePatterns = tsconfig.exclude || [];
    }
  } catch (e) {
    console.warn("Warning: Could not parse tsconfig.json for excludes:", e);
  }

  const glob = new Glob("**/*.{ts,tsx}");
  const files: string[] = [];

  // Find all .ts and .tsx files, excluding node_modules, the output directory, and tsconfig excludes
  for await (const path of glob.scan(PROJECT_ROOT)) {
    if (
      path.includes("node_modules") ||
      path.startsWith(OUTPUT_DIR) ||
      path.includes(".next") ||
      excludePatterns.some(p => path === p || path.startsWith(`${p}/`) || path.includes(`/${p}/`))
    ) {
      continue;
    }
    files.push(join(PROJECT_ROOT, path));
  }

  console.log(`Found ${files.length} files (.ts, .tsx).`);

  let partNumber = 1;
  let currentContent = "";
  let currentSize = 0;

  for (const filePath of files) {
    try {
      const f = file(filePath);
      const content = await f.text();
      const relativePath = filePath.replace(`${PROJECT_ROOT}${join("/")}`, "");
      const ext = filePath.endsWith(".tsx") ? "tsx" : "ts";

      const header = `\n\n// --- START OF FILE: ${relativePath} ---\n\`\`\`${ext}\n`;
      const footer = `\n\`\`\`\n// --- END OF FILE: ${relativePath} ---\n`;
      const fullFileContent = header + content + footer;
      const fileSize = Buffer.byteLength(fullFileContent, "utf8");

      if (currentSize + fileSize > MAX_SIZE && currentContent.length > 0) {
        const outputFileName = join(OUTPUT_DIR, `combined_part${partNumber}.ts`);
        await write(outputFileName, currentContent);
        console.log(`Saved ${outputFileName} (Size: ${(currentSize / 1024 / 1024).toFixed(2)} MB)`);
        partNumber++;
        currentContent = "";
        currentSize = 0;
      }

      currentContent += fullFileContent;
      currentSize += fileSize;
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
  }

  if (currentContent.length > 0) {
    const outputFileName = join(OUTPUT_DIR, `combined_part${partNumber}.ts`);
    await write(outputFileName, currentContent);
    console.log(`Saved ${outputFileName} (Size: ${(currentSize / 1024 / 1024).toFixed(2)} MB)`);
  }
}

run().catch(console.error);
