## Package Manager Configuration

- Always use Bun as the package manager instead of npm, yarn, or pnpm
- Use the specific Bun binary path: ~/.bun/bin/bun
- When installing packages, use: ~/.bun/bin/bun install
- When adding packages, use: ~/.bun/bin/bun add <package-name>
- When removing packages, use: ~/.bun/bin/bun remove <package-name>
- When running scripts, use: ~/.bun/bin/bun run <script-name>
- When executing files directly, use: ~/.bun/bin/bun <file-path>

## Scripts and Commands

- Prefer Bun's built-in commands over npm equivalents
- Use `~/.bun/bin/bun create` for scaffolding new projects
- Use `~/.bun/bin/bun test` for running tests
- Use `~/.bun/bin/bun build` for building projects

## File Operations

- When creating package.json files, ensure they're compatible with Bun
- When suggesting package installations, always use Bun syntax
- When providing terminal commands, use the full path to Bun binary

## Development Workflow

- Always assume Bun is the preferred runtime and package manager
- Suggest Bun-specific optimizations and features when relevant
- Use Bun's faster installation and execution capabilities

## Code Quality Checks

**IMPORTANT: Check in this exact order:**

1. **CodeScene Diagnostics (FIRST)** - After making any code modifications, ALWAYS check CodeScene diagnostics FIRST using `getDiagnostics` tool
   - Check for: Code Duplication, Bumpy Road Ahead, Complex Method, Large Method, Primitive Obsession
   - Fix ALL CodeScene warnings before proceeding to linting
   - Refactor code to eliminate all warnings (see code-quality.md steering for patterns)
   - Re-check diagnostics after refactoring to ensure all issues are resolved

2. **TypeScript Compilation (SECOND)** - After CodeScene diagnostics are clean, run `~/.bun/bin/bun tsgo` to check for TypeScript compilation errors
   - Fix any type errors
   - Ensure strict type checking passes

3. **Linting (THIRD)** - After TypeScript compilation passes, run `~/.bun/bin/bun lint` to check for linting issues
   - Fix any ESLint errors
   - Address any code style violations

4. **CodeScene Analysis (FOURTH)** - After linting passes, run `~/.bun/bin/bun codescene` to perform code quality analysis
   - Check for code health issues
   - Verify all metrics meet full health thresholds
   - Address any remaining quality concerns
   - For detailed analysis of a specific file, use the shell script: `cs check --verbose <file>`

5. **SonarQube Scan (FIFTH)** - After CodeScene analysis passes, run `~/.bun/bin/bun sonar-scan` to perform final static analysis
   - Check for security vulnerabilities
   - Verify code coverage and quality gates
   - Address any critical or blocker issues

**Workflow:**

```
Code Changes → CodeScene Diagnostics → TypeScript Check → Linting → CodeScene Analysis → SonarQube Scan → Task Complete
     ↓              ↓ (if warnings)         ↓ (if errors)    ↓ (if errors)    ↓ (if issues)        ↓ (if issues)
  Refactor ←────────┘                       │                │                │                     │
  Fix Types ←───────────────────────────────┘                │                │                     │
  Fix Style ←────────────────────────────────────────────────┘                │                     │
  Refactor ←──────────────────────────────────────────────────────────────────┘                     │
  Fix Issues ←───────────────────────────────────────────────────────────────────────────────────────┘
```

- Fix any issues found at each step before moving to the next step
- If CodeScene diagnostics show warnings, address them immediately and re-check
- These checks should be run automatically after any file modifications or code changes
- NEVER skip CodeScene diagnostics - they catch architectural issues that linting misses

## Code Style Rules

- **No nested ternary operators** - SonarJS will flag them as code smells
- Extract nested ternaries into if/else statements or separate functions

## Commit Message Rules

- Write concise, descriptive commit messages that clearly explain what was changed
- Focus on the actual changes made, not on compliance statements
- NEVER include repetitive endings like "- Ensured all changes comply with Bun package manager rules and maintain code quality standards."
- Use imperative mood (e.g., "Add feature" not "Added feature" or "Adding feature")

## Logging

- **NEVER use `console` methods directly** - ESLint will error
- **Always use the logger utility**: `import { logger } from '@/src/utils/logger'`
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`
- `info`, `warn`, and `debug` are suppressed in production; `error` always logs.

## React & Next.js Patterns

- **Event Types**: NEVER use `FormEvent` (deprecated/removed in React 19). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`.
- **FormData**: Always cast results: `(formData.get("name") as string | null) ?? ""` to avoid `@typescript-eslint/no-base-to-string`.
- **Context/Hooks**: Keep `Context`, `Provider`, and `useHook` in separate files to avoid Fast Refresh warnings.
- **NextAuth**: In App Router `route.ts`, cast handler: `const handler = NextAuth(authOptions) as (req: Request) => Promise<Response>`.
- **Arabic Text**: CSpell is configured to ignore Arabic via regex. Use Arabic in strings/comments freely.
