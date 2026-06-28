# Mermaid Prompt Rules

This file contains the authoritative Mermaid syntax rules injected into LLM prompts for chapters with `includeDiagrams: true`.

---

MERMAID SYNTAX RULES (MUST follow to ensure diagrams render):
- NEVER use `<br/>` or `<br>` tags in node labels. Use `\n` for line breaks instead.
- NEVER put spaces inside gitGraph commit IDs. Use hyphens: commit id: "Feature-commit" NOT commit id: "Feature commit".
- In pie charts, all values MUST sum to exactly 100. Verify before outputting.
- In quadrantChart, use this exact format:
  ```mermaid
  quadrantChart
  title ...
  x-axis Low --> High
  y-axis Low --> High
  quadrant-1 Critical
  quadrant-2 High
  quadrant-3 Medium
  quadrant-4 Low
  Data_Point: [x, y]
  ```
- Do NOT use `%%{init:...}%%` directives with theme overrides (they conflict with Quarto rendering). Plain `%%{init:}%%` for non-theme config is acceptable.
- Use only standard diagram types: flowchart, graph, sequenceDiagram, classDiagram, erDiagram, gantt, pie, gitGraph, quadrantChart.
- In style and classDef lines, use only semantic class names. Do NOT use hardcoded hex colors (e.g. fill:#f9f).
- Ensure every Mermaid codeblock starts with the diagram type keyword on the FIRST line after the opening fence.

---

## Updating Rules

To update the rules:
  1. **Buffers** - Edit the constants in `lib/mermaid-rules.ts`
  2. **Semantics** - The generation flow (`index.ts`) filters chapters by `includeDiagrams: true`, prepends the **exact** output above to their system prompts
  3. **Validation** - `validate-mermaid.ts` enforces the rules via lint checks

Never duplicate rules in chapter configs.