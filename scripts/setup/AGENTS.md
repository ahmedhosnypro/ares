# Ares Setup Script - Agent Instructions

## Package Manager Configuration

- Always use Bun as the package manager instead of npm, yarn, or pnpm
- Use the specific Bun binary path: ~/.bun/bin/bun
- When installing packages, use: ~/.bun/bin/bun install
- When adding packages, use: ~/.bun/bin/bun add <package-name>
- When removing packages, use: ~/.bun/bin/bun remove <package-name>
- When running scripts, use: ~/.bun/bin/bun run <script-name>
- When executing files directly, use: ~/.bun/bin/bun <file-path>

## Project Context

This is a **command-line setup script** for the Ares Car Rental application. It:

- Checks system requirements (.NET, Node, Bun, SQL Server)
- Generates secure configuration files
- Sets up database (migrations, seeding)
- Starts backend and frontend servers
- Verifies health endpoints

## Code Quality Checks

**IMPORTANT: Check in this exact order:**

1. **TypeScript Compilation (FIRST)** - Run `~/.bun/bin/bun run typecheck` (uses tsgo, not tsc)
   - Fix any type errors
   - Ensure strict type checking passes
   - tsgo is TypeScript's native compiler (faster than tsc)

2. **Linting (SECOND)** - Run `~/.bun/bin/bun lint` to check for linting issues
   - Fix any ESLint errors
   - Address any code style violations
   - Run `~/.bun/bin/bun lint:fix` to auto-fix issues

3. **Formatting (THIRD)** - Run `~/.bun/bin/bun format:check` to verify code formatting
   - Run `~/.bun/bin/bun format` to auto-format code
   - Ensure consistent code style

**Workflow:**

```
Code Changes → TypeScript Check → Linting → Formatting → Task Complete
     ↓              ↓ (if errors)    ↓ (if errors)  ↓ (if issues)
  Fix Types ←───────┘                │              │
  Fix Style ←────────────────────────┘              │
  Format ←──────────────────────────────────────────┘
```

## CLI-Specific Rules

### Console Usage

- **Console methods ARE ALLOWED** in CLI tools (unlike web apps)
- Use `console.log`, `console.error`, `console.warn` freely
- Prefer the logger utility for better formatting:
  - `logInfo()`, `logSuccess()`, `logError()`, `logWarn()`, `logDebug()`
  - These provide colored output and spinners

### No React/Next.js Rules

- This is a Node.js/Bun CLI tool, not a React app
- No React-specific linting rules apply
- No JSX/TSX files
- No browser globals

### Process & Exit

- Use `process.exit(0)` for success
- Use `process.exit(1)` for errors
- Use `process.argv` for command-line arguments
- Use `process.env` for environment variables

## TypeScript Configuration

- Uses strict type checking
- Target: ES2023
- Module: ESNext
- No `any` types allowed
- No non-null assertions (`!`) allowed
- All functions must have return types

## Import Rules

- **NO Node.js imports** - Use Bun's built-in APIs instead:
  - ❌ `import { readFile } from 'fs'` → ✅ `Bun.file(path)`
  - ❌ `import { randomBytes } from 'crypto'` → ✅ `crypto.getRandomValues()`
  - ❌ `import { join } from 'path'` → ✅ Use string concatenation or URL
- Use `import { $ } from 'bun'` for shell commands
- Use `Bun.spawn()` for process management
- Use `Bun.write()` for file writing

## Dependencies

### Runtime Dependencies

- `chalk` - Terminal colors
- `ora` - Elegant spinners
- `prompts` - Interactive prompts
- `zod` - Runtime type validation

### Dev Dependencies

- `@typescript/native-preview` - tsgo (TypeScript native compiler)
- `@cspell/eslint-plugin` - Spell checking
- `eslint-plugin-sonarjs` - Code quality rules
- `typescript-eslint` - TypeScript linting
- `prettier` - Code formatting

## File Structure

```
scripts/setup/
├── setup.ts              # Main entry point
├── index.ts              # Orchestration logic
├── lib/                  # Reusable utilities
│   ├── colors.ts         # Color definitions
│   ├── logger.ts         # Logging with spinners
│   ├── utils.ts          # General utilities
│   ├── validators.ts     # Zod validation schemas
│   └── sql.ts            # SQL Server utilities
├── checks/               # System requirement checks
├── config/               # Environment configuration
├── database/             # Database operations
├── backend/              # Backend setup
└── frontend/             # Frontend setup
```

## Coding Patterns

### Error Handling

```typescript
try {
  await someOperation();
} catch (error) {
  logError(`Operation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(1);
}
```

### Spinners

```typescript
const spinner = startSpinner("Installing dependencies...");
try {
  await installDeps();
  stopSpinner(true, "Dependencies installed!");
} catch (error) {
  stopSpinner(false, "Installation failed");
  throw error;
}
```

### Prompts

```typescript
const shouldContinue = await askYesNo("Continue with setup?", true);
const dbHost = await askInput("Database host", "localhost");
const dbPassword = await askPassword("Database password");
```

### Validation

```typescript
import { z } from "zod";

const configSchema = z.object({
  url: z.string().url(),
  port: z.number().int().min(1).max(65535),
});

const result = configSchema.safeParse(config);
if (!result.success) {
  logError("Invalid configuration");
  process.exit(1);
}
```

## SQL Server Strategy

- **Primary method**: Use .NET for all database operations
- Create minimal C# programs, compile and run with `dotnet script`
- No need for sqlcmd or mssql-cli
- Example:
  ```typescript
  const testProgram = `
  using Microsoft.Data.SqlClient;
  try {
      using var conn = new SqlConnection(args[0]);
      await conn.OpenAsync();
      Console.WriteLine("SUCCESS");
  } catch (Exception ex) {
      Console.WriteLine($"ERROR:{ex.Message}");
      Environment.Exit(1);
  }
  `;
  await Bun.write("/tmp/test.csx", testProgram);
  const result = await $`dotnet script /tmp/test.csx ${connectionString}`.text();
  ```

## Commit Message Rules

- Write concise, descriptive commit messages
- Focus on actual changes, not compliance statements
- Use imperative mood (e.g., "Add feature" not "Added feature")
- NEVER include repetitive endings about compliance

## Testing

- Test the setup script frequently: `bun run setup.ts`
- Test with different flags: `--quick`, `--debug`, `--help`
- Verify type checking: `bun run typecheck`
- Verify linting: `bun run lint`
- Verify formatting: `bun run format:check`

## Phase Completion Checklist

After completing each phase:

1. ✅ Run `bun run typecheck` - must pass
2. ✅ Run `bun run lint` - must pass
3. ✅ Run `bun run format:check` - must pass
4. ✅ Test the script: `bun run setup.ts`
5. ✅ Commit changes with descriptive message

## Common Pitfalls

- ❌ Don't use Node.js imports (fs, path, crypto)
- ❌ Don't use `tsc` (use `tsgo` instead)
- ❌ Don't forget to handle errors gracefully
- ❌ Don't use `any` types
- ❌ Don't use non-null assertions (`!`)
- ✅ Always validate user input with Zod
- ✅ Always provide helpful error messages
- ✅ Always clean up temp files
- ✅ Always use spinners for long operations

## Spell Checking

- CSpell is configured to check spelling
- Custom words are in `cspell.config.yaml`
- Add project-specific terms to the words list
- Run linter to catch spelling errors
