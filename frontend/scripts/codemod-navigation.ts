import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";

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

function processFile(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const changes: string[] = [];
  let modified = content;

  // Step 1: Handle `from "next/navigation"` imports
  const nextNavImportRegex = /^import\s*\{([^}]+)\}\s*from\s*"next\/navigation"\s*;?\s*$/;
  let nextNavImportLineIdx = -1;
  let nextNavImports = "";

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(nextNavImportRegex);
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
        // Split: keep some on next/navigation, add routing imports
        newLines[nextNavImportLineIdx] = `import { ${keepSymbols.join(", ")} } from "next/navigation";`;
        newLines.splice(nextNavImportLineIdx + 1, 0, `import { ${routingSymbols.join(", ")} } from "${ROUTING_PATH}";`);
        changes.push(`Split import: routing=[${routingSymbols.join(",")}] keep=[${keepSymbols.join(",")}]`);
      } else {
        // All go to routing
        newLines[nextNavImportLineIdx] = `import { ${routingSymbols.join(", ")} } from "${ROUTING_PATH}";`;
        changes.push(`Move import: routing=[${routingSymbols.join(",")}]`);
      }

      modified = newLines.join("\n");
    }
  }

  // Step 2: Handle `import Link from "next/link"`
  const nextLinkImportRegex = /^import\s+Link\s+from\s+"next\/link"\s*;?\s*$/;
  const linkMatch = modified.match(nextLinkImportRegex);
  if (linkMatch) {
    // Check if there's already an import from routing
    const hasRoutingImport = modified.includes(`from "${ROUTING_PATH}"`);

    if (hasRoutingImport) {
      // Remove the Link default import and add Link to the existing routing import
      modified = modified.replace(nextLinkImportRegex, "");
      // Add Link to existing routing import
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
      // Replace default import with named import
      modified = modified.replace(nextLinkImportRegex, `import { Link } from "${ROUTING_PATH}";`);
      changes.push("Replace Link default import with routing named import");
    }
  }

  // Step 3: Handle server-side redirect() call signature changes
  // next-intl redirect requires: redirect({href: "/path", locale: "en"})
  // Need to find redirect() calls that use the old string signature
  if (
    (content.includes("redirect(") &&
      !content.includes('"use client"') &&
      content.includes(`from "${ROUTING_PATH}"`)) ||
    (nextNavImports.includes("redirect") && !content.includes('"use client"'))
  ) {
    // Server-side file with redirect from routing
    // Pattern: redirect("/path") or redirect(`/path/${var}`)
    const oldRedirectRegex = /redirect\(\s*([`"][^)]*?[`"])\s*\)/g;
    let redirectMatch;
    const redirectCalls: string[] = [];

    while ((redirectMatch = oldRedirectRegex.exec(modified)) !== null) {
      const fullMatch = redirectMatch[0];
      // Skip if it's already using object syntax
      if (fullMatch.includes("href:") || fullMatch.includes("{")) continue;
      redirectCalls.push(fullMatch);
    }

    if (redirectCalls.length > 0) {
      changes.push(`Found ${redirectCalls.length} redirect() calls needing signature update`);
    }
  }

  // Write back if changed
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
