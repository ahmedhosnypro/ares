# PDF Generation with Quarto

This directory uses [Quarto](https://quarto.org) to render the generated Markdown chapters into a single, professionally-formatted A4 PDF. This replaces the old character-based page estimation with an **accurate PDF page count**.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Quarto CLI | ≥1.9 | `winget install Quarto.Quarto` or from [quarto.org](https://quarto.org) |
| MiKTeX | Any recent | Already at `C:\Users\PC\AppData\Local\Programs\MiKTeX` |
| LuaLaTeX | Bundled with MiKTeX | Auto-detected via PATH |

MiKTeX must be on the system `PATH`. The `pdf.ts` script automatically prepends the MiKTeX bin directory when needed.

## Commands

```bash
bun run pdf              # Render all chapters → _pdf/ares-docs.pdf
bun run pdf:count        # Report page count of existing PDF only
bun run pdf:clean        # Delete previous build, then re-render
```

## Output

- **PDF file**: `_pdf/ares-docs.pdf`
- **Accurate page count** is printed after each build and parsed directly from the PDF's internal `/Type /Page` objects (not estimated from character counts).

## How It Works

1. `_quarto.yml` defines a Quarto **book** project that assembles all `generated/*.md` chapter files in order.
2. `quarto render --to pdf` converts the Markdown → LaTeX → PDF using **LuaLaTeX** (MiKTeX's engine with Unicode/OpenType support).
3. The PDF is placed in `_pdf/` (gitignored).
4. `pdf.ts` scans the PDF binary for `/Type /Page` markers to count actual rendered pages.

## Configuration (`_quarto.yml`)

The PDF format follows the Al-Azhar University graduation project rubric:

| Setting | Value |
|---------|-------|
| Paper size | A4 |
| Top margin | 30mm |
| Bottom margin | 25mm |
| Left margin | 38mm |
| Right margin | 25mm |
| Font | Times New Roman 12pt |
| Line spacing | 1.5 |
| Paragraph indent | 4em |
| TOC depth | 3 levels |
| Section numbering | On (depth 3) |

The `include-before-body` LaTeX block inserts a cover page (university name, faculty, department, project title, year) and an examiner committee signature page before the generated content.

## Page Count Validation

After running `bun run generate`, the page count validation step now checks for an existing PDF at `_pdf/ares-docs.pdf`:

- **If the PDF exists** → reads actual rendered pages from the PDF (accurate).
- **If the PDF is missing** → falls back to the old character-based estimation (~3000 chars/page, approximate).

Run `bun run pdf` after generation to get the accurate count, then re-run `bun run generate` to see the validated page count.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `No TeX installation was detected` | Ensure MiKTeX bin is on PATH. The `pdf.ts` script handles this automatically, but direct `quarto render` calls need `PATH` set. |
| `missing packages (automatic installed disabled)` | Run `miktex packages install <package-name>` from the MiKTeX bin directory, or enable auto-install in MiKTeX Console. |
| `tabu.sty not found` | Run: `& "C:\Users\PC\AppData\Local\Programs\MiKTeX\miktex\bin\x64\miktex.exe" packages install tabu` |
| LuaLaTeX font errors | Ensure "Times New Roman", "Arial", and "Consolas" are installed (they ship with Windows). |

## File Structure

```
scripts/docs/
├── _quarto.yml          # Quarto book project config (PDF format, margins, fonts)
├── index.md             # Book landing page (required by Quarto)
├── generate.ts          # Main generation entry point
├── index.ts             # Generation logic + mermaid rule injection + page validation
├── pdf.ts               # Bun script: render PDF + count pages
├── validate-mermaid.ts  # Mermaid diagram validator (CLI + library)
├── mermaid-iterate.ts   # Mermaid iteration loop (validate→improve→regenerate)
├── chapters.ts          # Chapter config registry + ChapterConfig type
├── chapters/            # Chapter definitions (prompts, patterns, includePatterns)
├── lib/                 # Shared utilities
│   ├── ai-client.ts     # OpenAI streaming client
│   ├── aggregate.ts     # Multi-part chapter aggregation
│   ├── chapter-splitter.ts  # Token-based chapter splitting
│   ├── config.ts        # Zod-validated env config
│   ├── logger.ts        # Spinner + colorized logging
│   ├── mermaid-rules.ts # Single source of truth for Mermaid prompt rules
│   ├── output.ts        # Markdown file writer + cleaner
│   ├── repomix.ts       # Repository context packing
│   └── token-utils.ts   # Token budget estimation
├── generated/           # Output Markdown chapters (input to Quarto)
└── _pdf/                # PDF output (gitignored)
    └── ares-docs.pdf
```
