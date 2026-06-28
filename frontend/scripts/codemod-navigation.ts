import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";

// cspell:ignore syms

const ROUTING_IMPORTS = ["useRouter", "usePathname", "redirect", "Link"] as const;
const KEEP_FROM_NEXT_NAV = ["notFound", "useParams", "useSearchParams", "useServerInsertedHTML"] as const;
const ROUTING_PATH = "@/shared/i18n/routing";

interface FileResult {
  file: string;
  changes: string[];
}

const results: FileResult[] = [];

function walkDir(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      files.push(...walkDir(fullPath));
    } else if (/\.(tsx?|mts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function handleNextLinkImport(modified: string, changes: string[]): string {
  const nextLinkImportRegex = /^import\s+Link\s+from\s+"next\/link"\s*;?$/;
  const linkMatch = nextLinkImportRegex.exec(modified);
  if (!linkMatch) return modified;

  const hasRoutingImport = modified.includes(`from "${ROUTING_PATH}"`);

  if (hasRoutingImport) {
    modified = modified.replace(nextLinkImportRegex, "");
    modified = modified.replace(
      /import\s*\{([^}]+)\}\s*from\s*"@\/shared\/i18n\/routing"\s*;/,
      (_, existing: string) => {
        const syms = existing.split(",").map((s: string) => s.trim());
        if (!syms.includes("Link")) {
          syms.push("Link");
        }
        return `import { ${syms.join(", ")} } from "${ROUTING_PATH}";`;
      }
    );
    changes.push("Merge Link into existing routing import");
  } else {
    modified = modified.replace(nextLinkImportRegex, `import { Link } from "${ROUTING_PATH}";`);
    changes.push("Replace Link default import with routing named import");
  }

  return modified;
}

function handleRedirectSignature(modified: string, content: string, nextNavImports: string, changes: string[]): void {
  if (
    (content.includes("redirect(") &&
      !content.includes('"use client"') &&
      content.includes(`from "${ROUTING_PATH}"`)) ||
    (nextNavImports.includes("redirect") && !content.includes('"use client"'))
  ) {
    const oldRedirectRegex = /redirect\(\s*([`"][^)]*?[`"])\s*\)/g;
    let redirectMatch;
    const redirectCalls: string[] = [];

    while ((redirectMatch = oldRedirectRegex.exec(modified)) !== null) {
      const fullMatch = redirectMatch[0];
      if (fullMatch.includes("href:") || fullMatch.includes("{")) continue;
      redirectCalls.push(fullMatch);
    }

    if (redirectCalls.length > 0) {
      changes.push(`Found ${redirectCalls.length} redirect() calls needing signature update`);
    }
  }
}

function processFile(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const changes: string[] = [];
  let modified = content;

  const nextNavImportRegex = /^import\s*\{([^}]+)\}\s*from\s*"next\/navigation"\s*;?$/;
  let nextNavImportLineIdx = -1;
  let nextNavImports = "";

  for (let i = 0; i < lines.length; i++) {
    const match = nextNavImportRegex.exec(lines[i]);
    if (match) {
      nextNavImportLineIdx = i;
      nextNavImports = match[1].trim();
      break;
    }
  }

  if (nextNavImportLineIdx !== -1) {
    const symbols = nextNavImports.split(",").map(s => s.trim());
    const routingSymbols = symbols.filter(s => ROUTING_IMPORTS.includes(s as (typeof ROUTING_IMPORTS)[number]));
    const keepSymbols = symbols.filter(s => KEEP_FROM_NEXT_NAV.includes(s as (typeof KEEP_FROM_NEXT_NAV)[number]));

    if (routingSymbols.length > 0) {
      const newLines = [...lines];

      if (keepSymbols.length > 0) {
        newLines[nextNavImportLineIdx] = `import { ${keepSymbols.join(", ")} } from "next/navigation";`;
        newLines.splice(nextNavImportLineIdx + 1, 0, `import { ${routingSymbols.join(", ")} } from "${ROUTING_PATH}";`);
        changes.push(`Split import: routing=[${routingSymbols.join(",")}] keep=[${keepSymbols.join(",")}]`);
      } else {
        newLines[nextNavImportLineIdx] = `import { ${routingSymbols.join(", ")} } from "${ROUTING_PATH}";`;
        changes.push(`Move import: routing=[${routingSymbols.join(",")}]`);
      }

      modified = newLines.join("\n");
    }
  }

  modified = handleNextLinkImport(modified, changes);

  handleRedirectSignature(modified, content, nextNavImports, changes);

  if (modified !== content) {
    writeFileSync(filePath, modified, "utf-8");
    results.push({ file: relative(process.cwd(), filePath), changes });
  }
}

function main(): void {
  const cwd = process.cwd();
  const files = walkDir(cwd);

  for (const file of files) {
    try {
      processFile(file);
    } catch (err) {
      console.error(`Error processing ${relative(cwd, file)}:`, err);
    }
  }

  console.log(`\n=== Results: ${results.length} files modified ===\n`);
  for (const r of results) {
    console.log(`${r.file}:`);
    for (const c of r.changes) {
      console.log(`  - ${c}`);
    }
  }
}

main();
