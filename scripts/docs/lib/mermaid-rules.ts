/**
 * Single source of truth for all Mermaid prompt rules used in the
 * documentation generation pipeline. Chapter configs should import
 * from here instead of duplicating rule strings.
 */

// ─── Individual named rule constants ────────────────────────────────────────

export const RULE_NO_BR_TAGS = "NEVER use <br/> or <br> tags in node labels. Use \\n for line breaks instead.";

export const RULE_GITGRAPH_COMMIT_IDS =
  'NEVER put spaces inside gitGraph commit IDs. Use hyphens: commit id: "Feature-commit" NOT commit id: "Feature commit".';

export const RULE_PIE_SUM_100 = "In pie charts, all values MUST sum to exactly 100. Verify before outputting.";

export const RULE_NO_INIT_DIRECTIVES =
  "Do NOT use %%{init:...}%% directives with theme overrides (they conflict with Quarto rendering). Plain %%{init:}%% for non-theme config is acceptable.";

export const RULE_STANDARD_DIAGRAM_TYPES =
  "Use only standard diagram types: flowchart, graph, sequenceDiagram, classDiagram, erDiagram, gantt, pie, gitGraph, quadrantChart.";

export const RULE_SEMANTIC_CLASS_NAMES =
  "In style and classDef lines, use only semantic class names. Do NOT use hardcoded hex colors (e.g. fill:#f9f).";

export const RULE_DIAGRAM_TYPE_FIRST_LINE =
  "Ensure every Mermaid codeblock starts with the diagram type keyword on the FIRST line after the opening fence.";

// ─── Quadrant chart template ────────────────────────────────────────────────

export const MERMAID_QUADRANT_CHART_TEMPLATE = [
  "quadrantChart",
  "    title ...",
  "    x-axis Low --> High",
  "    y-axis Low --> High",
  "    quadrant-1 Critical",
  "    quadrant-2 High",
  "    quadrant-3 Medium",
  "    quadrant-4 Low",
  "    Data_Point: [x, y]",
].join("\n");

export const RULE_QUADRANT_CHART_FORMAT = `In quadrantChart, use this exact format:\n${MERMAID_QUADRANT_CHART_TEMPLATE}`;

// ─── Supported diagram types ────────────────────────────────────────────────

export const MERMAID_DIAGRAM_TYPES: string[] = [
  "flowchart",
  "graph",
  "sequenceDiagram",
  "classDiagram",
  "erDiagram",
  "gantt",
  "pie",
  "gitGraph",
  "quadrantChart",
];

// ─── All rules as an ordered array ──────────────────────────────────────────

export const MERMAID_PROMPT_RULES: string[] = [
  RULE_NO_BR_TAGS,
  RULE_GITGRAPH_COMMIT_IDS,
  RULE_PIE_SUM_100,
  RULE_QUADRANT_CHART_FORMAT,
  RULE_NO_INIT_DIRECTIVES,
  RULE_STANDARD_DIAGRAM_TYPES,
  RULE_SEMANTIC_CLASS_NAMES,
  RULE_DIAGRAM_TYPE_FIRST_LINE,
];

// ─── Header used in system prompts ─────────────────────────────────────────

const MERMAID_RULES_HEADER = "MERMAID SYNTAX RULES (MUST follow to ensure diagrams render):";

// ─── Convenience function ───────────────────────────────────────────────────

/**
 * Returns the full mermaid rules block suitable for appending to a
 * systemPrompt. The header is followed by each rule on its own line
 * with a "- " prefix, separated by newlines.
 *
 * Example output (used in systemPrompt arrays joined with " "):
 *   "MERMAID SYNTAX RULES ...:\n- NEVER use <br/> ...\n- NEVER put ..."
 */
export function getMermaidSystemPromptSection(): string {
  const rules = MERMAID_PROMPT_RULES.map(rule => `- ${rule}`).join("\n");
  return `${MERMAID_RULES_HEADER}\n${rules}`;
}
