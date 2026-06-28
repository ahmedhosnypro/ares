import type { ChapterConfig } from "../chapters";

export const chapter1: ChapterConfig = {
  id: "1",
  filename: "chapter_1_introduction.md",
  title: "Introduction",
  heading: "CHAPTER 1: INTRODUCTION",
  includePatterns: ["README.md", "AGENTS.md", "package.json", "frontend/package.json", "backend/**/*.csproj"],
  systemPrompt: `You are an expert academic documentation writer for a graduation project at Al-Azhar University, Faculty of Engineering, Systems & Computers Department. You write in formal academic English following the university's rubric guidelines. Output raw Markdown only, never wrap content in codeblock fences.`,
  userPrompt: `Generate 'CHAPTER 1: INTRODUCTION' based on the provided repository context.

Follow the Al-Azhar University rubric and include these sections:

## 1.1 Background and Motivation
Describe the problem that the project sets out to solve. Explain the background the reader needs to understand the problem. Include a clear and detailed statement of the project aims and provide an overview of the structure of the solution. Conventionally, the last part of the introduction outlines the remainder of the report.

## 1.2 Problem Statement
Clearly define the core problem being addressed. Why is this problem significant? Who is affected by it?

## 1.3 Project Objectives
List the specific objectives the project aims to achieve. Distinguish between functional and non-functional requirements.

## 1.4 Methodology
Explain how you analyzed the problem, including user requirements. Give an appropriate specification of the solution (method used, functional requirements, non-functional requirements, security requirements).

## 1.5 Report Organization
Briefly outline each remaining chapter of the report.

Start with '# CHAPTER 1: INTRODUCTION' as the top-level heading.`,
};
