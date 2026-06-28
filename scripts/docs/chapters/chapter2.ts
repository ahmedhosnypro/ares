import type { ChapterConfig } from "../chapters";

export const chapter2: ChapterConfig = {
  id: "2",
  filename: "chapter_2_background.md",
  title: "Background Materials",
  heading: "CHAPTER 2: BACKGROUND MATERIALS",
  includePatterns: [
    "README.md",
    "package.json",
    "frontend/package.json",
    "backend/**/*.csproj",
    "frontend/next.config.*",
    "frontend/middleware.*",
    "frontend/providers/**",
    "backend/Api/Program.cs",
  ],
  systemPrompt: `You are an expert academic documentation writer for a graduation project at Al-Azhar University, Faculty of Engineering, Systems & Computers Department. You write in formal academic English following the university's rubric guidelines. Output raw Markdown only, never wrap content in codeblock fences. Limit background to what the reader needs to know to understand the solution developed. Include Mermaid diagrams in codeblocks when describing architecture or timelines, referencing Figure X.x.`,
  userPrompt: `Generate 'CHAPTER 2: BACKGROUND MATERIALS' based on the provided repository context.

This chapter introduces the necessary background material related to the underlying project. Limit yourself to what the reader needs to know to understand the solution that has been developed.

Include these sections:

## 2.1 Introduction
Brief overview of the chapter's purpose and structure.

## 2.2 Technology Stack
Present the technologies, frameworks, and libraries used in the project. For each, explain what it is, why it was chosen, and how it fits into the architecture. Include a Mermaid timeline of technology adoption:

` + "```mermaid\n%% Tech Stack Timeline\ngantt\ntitle Technology Adoption Timeline\n  Initial Setup : milestone, start, 2025-09-01, 1d\n  Frontend Setup : milestone, 2025-09-10, 1d\n  Backend Core  : milestone, 2025-10-01, 1d\n  Testing Suite : milestone, 2025-11-01, 1d\n```" + `

Reference: _Figure 2.2: Technology adoption timeline showing major milestones._

Cover:
- Backend technologies (e.g., .NET, Entity Framework, SQL Server)
- Frontend technologies (e.g., Next.js, React, TypeScript, Material UI)
- Infrastructure and tooling (e.g., Bun, Docker, CI/CD)

## 2.3 Domain Concepts
Explain key domain concepts relevant to the car rental system (e.g., booking workflows, payment processing, fleet management).

## 2.4 Related Work and Literature Review
Review existing approaches to similar problems. Compare alternative solutions and justify the chosen approach.

Use standard markdown numbering hierarchy (e.g., 2.2.1, 2.2.2 for subsections, and A.I, A.I.1 for further nesting).

Start with '# CHAPTER 2: BACKGROUND MATERIALS' as the top-level heading.`,
};
