# Mermaid Validation Workflow

This document explains the full lifecycle of Mermaid diagram validation in the Ares documentation pipeline.

## Core Components

| File | Purpose | Execution Point |
|------|---------|-----------------|
| `lib/mermaid-rules.ts` | Single source of truth for Mermaid rules | Chapter generation (prompt injection) |
| `lib/mermaid-compiler.ts` | mmdc-based compilation for syntax error detection | Validation (primary tier) |
| `validate-mermaid.ts` | CLI + library for two-tier validation (mmdc + lint) | `validate-mermaid`, `generate --validate-mermaid`, `mermaid-check` |
| `mermaid-iterate.ts` | Automated prompt improvement loop for diagram chapters | `mermaid-iterate --chapter 3` |
| `mermaid-prompt.md` | AI-readable version of `mermaid-rules.ts` | Future LLM automation |

## Two-Tier Validation Flow

The `validate-mermaid.ts` script implements a two-tier strategy:

```mermaid
graph TD
    A[Markdown Input] --> B[Regex Structural Lint]
    A --> C[mmdc Compilation]
    C -->|success| D[Validated]
    C -->|ParseError| E["severity: ""error"""]
    B -->|issues| F["severity: ""warning"""]
    C -->|InfrastructureError| G["severity: ""warning"""]
    F --> D
    G --> D
```

### Tier 1: mmdc Compilation (Errors = `severity: "error"`)

- Runs each diagram through `@mermaid-js/mermaid-cli` (via Puppeteer/Chromium)
- Catches all syntax errors (invalid node IDs, wrong arrow syntax, unclosed brackets, Unicode issues, missing keywords, etc.)
- Error message format: `"Mermaid parse error on line X: got 'TOKEN', expecting [...]"`
- Infrastructure errors (Chrome launch failures, mmdc not found) map to `severity: "warning"` so `mermaid-iterate` doesn't loop on them

### Tier 2: Structural Lint (Warnings = `severity: "warning"`)

Enforces project-style conventions via regex:

| Check | Example Error | Improve Via |
|-------|---------------|-------------|
| `<br/>` tags | "Found `<br/>` tags in labels" | Use `\n` \\
| Hardcoded hex colors | "fill:#E3F2FD, stroke:#1565C0" | Theme classes |
| Pie chart sum ≠ 100% | "sum to 103% but should sum to 100%" | Arithmetic review |
| Missing `__init:...`__ directives | "Do NOT use `%%{init:}%%` with theme overrides" | Remove/extract |
| gitGraph no branches | "No branches defined" | Add `branch y` |
| gitGraph commit ID spaces | "Invalid commit ID 'Feature Login'" | Use `Feature-Login` |
| quadrantChart missing axes | "Missing x-axis or y-axis" | Add `x-axis Low-->High` |
| quadrantChart invalid format | "Invalid quadrant format: 'quadrant-1[Label]'" | Use `quadrant-1 Label` |
| gantt missing dateFormat | "Missing dateFormat" | Add `dateFormat YYYY-MM-DD` |

## CLI Usage

| Command | Description |
|---------|-------------|
| `bun run validate-mermaid` | mmdc compilation + style lint (default) |
| `bun run validate-mermaid --no-compiler` | Regex lint only (skip mmdc) |
| `bun run validate-mermaid --log [path]` | Log errors to file (default: `mermaid-errors.log`) |
| `bun run validate-mermaid --clear-log` | Clear the error log |
| `bun run mermaid-check` | Alias for `validate-mermaid` |
| `bun run mermaid-compile` | mmdc compilation only (no style warnings) |
| `bun run mermaid-iterate --chapter 3` | Automated prompt improvement loop for chap 3 |
| `bun run generate --validate-mermaid` | Run mermaid check after each generate, log errors |

Options:

```text
--chapter <id>       Chapter ID to iterate on (required)
--max-iterations <n> Maximum regeneration attempts (default: 3)
--dry-run           Validate only, skip regeneration
--debug             Enable debug logging
```

## Generated File Integration

After each AI generation of a diagram chapter (`generate --validate-mermaid`), the pipeline:

1. Runs mermaid validation on the generated `.md` file
2. Logs ALL mermaid errors (`severity: "error"` only) to `mermaid-errors.log` in this format:
   ```
   === Post-Generation Validation - 2026-06-28T12:00:00.000Z ===

   File: chapter_3_system_design.md:44
   Diagram: graph
   [error] Mermaid parse error on line 2: Expecting 'PS', got 'NON_BREAKING_HYPHEN'
   
   File: chapter_3_system_design.md:69
   Diagram: flowchart
   [error] Mermaid parse error on line 5: invalid type 'string'
   
   Total errors: 2
   ```
3. For chapters with errors, recommends `mermaid-iterate`:
   ```
   info: Run `bun run mermaid-iterate --chapter 3` to auto-fix via prompt improvement
   ```

Error log commands:
- `--clear-mermaid-log`: Run before generation to start fresh
- `--validate-mermaid`: Auto-run validation + logging after generation

## Automation Workflow

```mermaid
graph LR
    Genesis[Start] --> Generate".md files via `generate`"]
    Generate -->|diagram chapters| Validate["Post-generate mermaid validation
--validate-mermaid"]
    Validate -->|Errors > 0| Log["Append errors →
mermaid-errors.log"]
    Validate -->|No errors| Success[Validation ✓]
    Log --> Improve["1. Parse mermaid-errors.log
    2. Update prompt additions
    3. Re-generate chapter
    4. Clear log & re-run"]
    Improve --> BetterResults{Errors reduced?}
    BetterResults -->|Yes| Repeat
    BetterResults -->|No| ManualFix
    Repeat --> Validate
```

This ensures:
- **From-start quality**: Mermaid rules injected into initial prompts
- **Post-generation hygiene**: Errors caught and logged immediately
- **Learning loop**: Failed generations improve the prompt, not the generated file
