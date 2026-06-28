# @ares/docs — Ares Documentation Generation Pipeline

This pipeline packs repository source code via Repomix, sends it to an AI model to generate academic chapters, aggregates multi-part chapters, and renders to PDF via Quarto + MiKTeX (LuaLaTeX). Built for the Ares Car Rental graduation project at Al-Azhar University.

## Quick Start

```bash
cp .env.example .env   # Fill in API credentials
bun install            # Install dependencies
bun run generate --all # Generate all chapters via AI
bun run pdf            # Render to PDF
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run generate --all` | Generate all chapters via AI |
| `bun run generate --chapter 3` | Generate a specific chapter |
| `bun run generate --dry-run` | Pack context and count tokens without calling AI |
| `bun run validate-mermaid` | Validate Mermaid diagrams (mmdc compilation + style lint) |
| `bun run mermaid-compile` | mmdc compilation only (no style warnings) |
| `bun run mermaid-check` | Run both mmdc compilation and style lint in one pass |
| `bun run mermaid-iterate --chapter 3` | Auto-iterate: validate → improve prompt → regenerate → revalidate |
| `bun run pdf` | Render generated Markdown → PDF |
| `bun run pdf:count` | Report accurate page count from existing PDF |
| `bun run pdf:clean` | Clean rebuild of PDF |
| `bun run typecheck` | TypeScript check (uses tsgo) |
| `bun run lint` | ESLint |
| `bun run format:check` | Prettier formatting check |

## Architecture

```
scripts/docs/
├── generate.ts              # Entry point (delegates to index.ts)
├── index.ts                 # Main generation logic + PDF-aware page validation
├── pdf.ts                   # Render PDF via Quarto + count pages
├── validate-mermaid.ts      # Mermaid diagram validator (CLI + library)
├── mermaid-iterate.ts       # Mermaid iteration loop (validate→improve→regenerate→revalidate)
├── chapters.ts              # Chapter config registry + ChapterConfig type
├── chapters/                # Chapter definitions (system/user prompts, include patterns)
│   ├── chapter1.ts ... chapter7.ts
│   ├── appendix-a.ts
│   └── appendix-b.ts
├── lib/                     # Shared utilities
│   ├── ai-client.ts         # OpenAI streaming client
│   ├── aggregate.ts         # Multi-part chapter aggregation
│   ├── chapter-splitter.ts  # Token-based chapter splitting
│   ├── config.ts            # Zod-validated env config (.env)
│   ├── logger.ts            # Spinner + colorized logging
│   ├── mermaid-compiler.ts  # mmdc compilation-based Mermaid syntax validation
│   ├── mermaid-rules.ts     # Single source of truth for Mermaid prompt rules
│   ├── output.ts            # Markdown file writer + cleaner
│   ├── repomix.ts           # Repository context packing via Repomix
│   └── token-utils.ts      # Token budget estimation
├── generated/               # Output Markdown chapters (input to Quarto)
├── _quarto.yml              # Quarto book project config
└── _pdf/                    # PDF output (gitignored)
```

## Generation Flow

1. Pack repository context (per-chapter include patterns via Repomix)
2. Auto-inject Mermaid rules into system prompt for diagram chapters
3. Split large chapters into parts (token-based)
4. Stream AI generation per part
5. Aggregate parts → final chapter `.md`
6. Render to PDF via Quarto

## Mermaid Diagram Pipeline

The pipeline ensures mermaid diagrams in generated chapters are syntactically correct using a two-tier validation approach:

### Single Source of Truth

`lib/mermaid-rules.ts` defines all mermaid syntax rules once. Chapters with `includeDiagrams: true` get these rules auto-injected into their system prompt by the generation flow — no duplication across chapter configs.

### Two-Tier Validation

`validate-mermaid.ts` validates all `.md` files in `generated/` using two tiers:

1. **Primary: mmdc compilation** (`lib/mermaid-compiler.ts`) — Runs each diagram through the real Mermaid parser via `@mermaid-js/mermaid-cli` (Puppeteer/Chromium). Catches all syntax errors (invalid arrows, unclosed brackets, Unicode issues, missing keywords, etc.). These produce `severity: "error"`.
2. **Secondary: project-style lint** — Regex checks for project conventions (hardcoded hex colors, `<br/>` tags, pie chart sums, etc.). These produce `severity: "warning"`.

If mmdc is unavailable (e.g., Chrome not found), the validator falls back to regex-only structural checks. Infrastructure errors (Chrome launch failures, timeouts) are reported as warnings, not errors.

Flags:

| Flag | Description |
|------|-------------|
| *(default)* | Run both mmdc compilation + style lint |
| `--no-compiler` | Run regex lint only (skip mmdc) |

### Iteration Loop

`mermaid-iterate.ts` automates fixing mermaid errors by improving the prompt, not by patching generated files:

```bash
bun run mermaid-iterate --chapter 4 --max-iterations 3
```

1. Validates the chapter's generated mermaid diagrams
2. Categorizes errors → builds targeted prompt improvements
3. Regenerates the chapter with improved mermaid rules (improvements accumulate across iterations)
4. Re-validates and repeats until clean or max iterations reached

CLI options:

| Flag | Default | Description |
|------|---------|-------------|
| `--chapter <id>` | required | Chapter ID to iterate on |
| `--max-iterations <n>` | 3 | Maximum regeneration attempts |
| `--dry-run` | false | Validate only, skip regeneration |
| `--debug` | false | Enable debug logging |

### Philosophy

The goal is to improve the **PROMPT** so the AI generates correct diagrams from the start — never to fix generated markdown files directly.

## Environment Configuration

- Copy `.env.example` to `.env` and fill in credentials
- Key vars: `CUSTOM_API_ENDPOINT`, `CUSTOM_API_KEY`, `AI_MODEL`, `MAX_INPUT_TOKENS`, `MAX_OUTPUT_TOKENS`
- Full list documented in `.env.example`

## Code Quality

```bash
bun run typecheck && bun run lint && bun run format:check
```
