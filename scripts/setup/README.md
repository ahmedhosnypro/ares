# Ares Car Rental - Setup Script Documentation

## 📋 Overview

This is a comprehensive, cross-platform setup script for the Ares Car Rental application. Built with TypeScript and Bun, it automates the entire development environment setup process.

**Key Features:**

- ✅ Single codebase for Windows, Linux, and macOS
- ✅ Type-safe with full TypeScript support
- ✅ Interactive prompts with sensible defaults
- ✅ Comprehensive system checks
- ✅ Automatic configuration generation
- ✅ Database migration and seeding
- ✅ Health check verification
- ✅ Graceful error handling and cleanup

---

## 🚀 Quick Start

### Prerequisites

**Required:**

- **Bun** ≥1.0 - [Installation Guide](https://bun.sh)
- **.NET SDK** ≥10.0 - [Download](https://dotnet.microsoft.com/download)
- **Node.js** ≥18.0 (optional, recommended for some tooling) - [Download](https://nodejs.org/)
- **SQL Server** - [Docker](#sql-server-setup) or [Native Install](https://www.microsoft.com/sql-server)

### Installation

```bash
# 1. Install dependencies
cd scripts/setup
bun install

# 2. Run setup from workspace root
cd ../..
bun setup.ts
```

---

## 📖 Usage

### Basic Commands

```bash
# Interactive setup (recommended)
bun setup.ts

# Quick setup with defaults
bun setup.ts --quick

# Show help
bun setup.ts --help
```

### Command-Line Options

| Option            | Description                            |
| ----------------- | -------------------------------------- |
| `--quick`         | Skip interactive prompts, use defaults |
| `--skip-checks`   | Skip tool installation checks          |
| `--skip-db`       | Skip database setup                    |
| `--skip-backend`  | Skip backend setup                     |
| `--skip-frontend` | Skip frontend setup                    |
| `--no-seed`       | Don't seed demo data                   |
| `--debug`         | Enable debug logging                   |
| `--help`, `-h`    | Show help message                      |

### Usage Examples

```bash
# Full interactive setup
bun setup.ts

# Quick setup without demo data
bun setup.ts --quick --no-seed

# Setup only backend (for backend developers)
bun setup.ts --skip-frontend

# Setup only frontend (for frontend developers)
bun setup.ts --skip-backend --skip-db

# Debug mode for troubleshooting
bun setup.ts --debug

# CI/CD mode (non-interactive)
export DB_PASSWORD="SecurePassword123!"
export JWT_SECRET="$(openssl rand -base64 64)"
bun setup.ts --quick --skip-checks
```

---

## 🏗️ Architecture

### Project Structure

```
scripts/setup/
├── index.ts                 # Main orchestration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── eslint.config.ts         # ESLint rules
├── .prettierrc              # Code formatting
├── cspell.config.yaml       # Spell checking
├── AGENTS.md                # Development guidelines
├── lib/                     # Utility libraries
│   ├── colors.ts            # Color definitions
│   ├── logger.ts            # Logging with spinners
│   ├── utils.ts             # General utilities
│   ├── validators.ts        # Zod validation schemas
│   └── sql.ts               # SQL Server utilities
├── checks/                  # System requirement checks
│   ├── os.ts                # OS detection
│   ├── dotnet.ts            # .NET SDK check
│   ├── node.ts              # Node.js check
│   ├── bun.ts               # Bun check
│   ├── sqlserver.ts         # SQL Server check
│   ├── ports.ts             # Port availability
│   └── index.ts             # Exports
├── config/                  # Configuration generation
│   ├── secrets.ts           # Secure secret generation
│   ├── backend-env.ts       # Backend .env setup
│   ├── frontend-env.ts      # Frontend .env.local setup
│   ├── validate.ts          # Config validation
│   └── index.ts             # Exports
├── database/                # Database operations
│   ├── connection.ts        # Connection testing
│   ├── migrations.ts        # EF Core migrations
│   ├── seed.ts              # Demo data seeding
│   ├── verify.ts            # Data verification
│   └── index.ts             # Exports
├── backend/                 # Backend setup
│   ├── build.ts             # Build backend
│   ├── start.ts             # Start server
│   ├── test.ts              # Health checks
│   ├── stop.ts              # Graceful shutdown
│   └── index.ts             # Exports
└── frontend/                # Frontend setup
    ├── install.ts           # Install dependencies
    ├── start.ts             # Start dev server
    ├── test.ts              # Health checks
    ├── stop.ts              # Graceful shutdown
    └── index.ts             # Exports
```

### Module Overview

#### **lib/** - Core Utilities

- **colors.ts**: Chalk-based color definitions for consistent terminal output
- **logger.ts**: Logging functions with spinners (ora), banners, and formatted messages
- **utils.ts**: File operations, prompts, port checking, OS detection, random generation
- **validators.ts**: Zod schemas for validating configuration files
- **sql.ts**: SQL Server utilities using .NET for database operations

#### **checks/** - System Checks

- **os.ts**: Detects OS type, architecture, Docker/devcontainer environment
- **dotnet.ts**: Verifies .NET SDK version, checks/installs dotnet-ef tool
- **node.ts**: Verifies Node.js version (≥18.x)
- **bun.ts**: Verifies Bun version (≥1.0)
- **sqlserver.ts**: Tests SQL Server connectivity using .NET
- **ports.ts**: Checks port availability (5000, 3000, 1433), offers to kill processes

#### **config/** - Configuration

- **secrets.ts**: Generates cryptographically secure secrets using Web Crypto API
- **backend-env.ts**: Interactive prompts for backend configuration, generates `.env`
- **frontend-env.ts**: Interactive prompts for frontend configuration, generates `.env.local`
- **validate.ts**: Validates all configuration files using Zod schemas

#### **database/** - Database Setup

- **connection.ts**: Tests database connection with retries
- **migrations.ts**: Runs EF Core migrations using dotnet-ef
- **seed.ts**: Seeds demo data using backend's built-in seeding
- **verify.ts**: Verifies seeded data by querying tables

#### **backend/** - Backend Setup

- **build.ts**: Builds backend using `dotnet restore` and `dotnet build`
- **start.ts**: Starts backend server using `Bun.spawn()`
- **test.ts**: Tests health endpoints and API accessibility
- **stop.ts**: Gracefully stops backend server

#### **frontend/** - Frontend Setup

- **install.ts**: Installs frontend dependencies using `bun install`
- **start.ts**: Starts Next.js dev server using `Bun.spawn()`
- **test.ts**: Tests health endpoints and homepage accessibility
- **stop.ts**: Gracefully stops frontend server

---

## 🔄 Setup Flow

### Phase 1: System Checks

1. Detect OS type and architecture
2. Check .NET SDK version (≥10.0)
3. Check/install dotnet-ef tool
4. Check Node.js version (≥18.x)
5. Check Bun version (≥1.0)
6. Test SQL Server connectivity
7. Check port availability (5000, 3000, 1433)

**Output Example:**

```
━━━ System Checks ━━━
✔ OS: Linux (x64)
✔ .NET SDK: 10.0.200
✔ dotnet-ef tool is installed
✔ Node.js: 25.9.0
✔ Bun: 1.3.12
✔ SQL Server: Microsoft SQL Server 2022
✔ Port 5000 (backend) is available
✔ Port 3000 (frontend) is available
✔ All system checks passed!
```

### Phase 2: Configuration

1. Generate secure JWT and NextAuth secrets
2. Prompt for backend configuration (database, CORS, logging, etc.)
3. Generate `backend/.env` file
4. Prompt for frontend configuration (API URL, NextAuth, etc.)
5. Generate `frontend/.env.local` file
6. Validate all configuration files

**Interactive Prompts:**

```
━━━ Configuration ━━━
? SQL Server host: localhost
? SQL Server port: 1433
? Database name: ares
? Database user: sa
? Database password: [hidden]
? JWT secret: [auto-generated]
? Enable CORS: Yes
? Allowed origins: http://localhost:3000
? Seed demo data: Yes
```

### Phase 3: Database Setup

1. Test database connection with retries
2. Run EF Core migrations
3. Seed demo data (if enabled)
4. Verify seeded data

**Output Example:**

```
━━━ Database Setup ━━━
✔ Database connection successful
✔ Running migrations...
✔ Migrations completed successfully
✔ Seeding demo data...
✔ Demo data seeded successfully
✔ Verifying seeded data...
✔ Found 10 users, 25 vehicles, 5 locations
```

### Phase 4: Backend Setup

1. Build backend project
2. Start backend server
3. Wait for server to be ready
4. Test health endpoints
5. Verify API accessibility

**Output Example:**

```
━━━ Backend Setup ━━━
✔ Building backend...
✔ Backend built successfully (12.3s)
✔ Starting backend server...
✔ Backend server started at http://localhost:5000
✔ Testing health endpoint...
✔ Backend is healthy and accessible
```

### Phase 5: Frontend Setup

1. Install frontend dependencies
2. Start frontend dev server
3. Wait for server to be ready
4. Test health endpoints
5. Verify homepage accessibility

**Output Example:**

```
━━━ Frontend Setup ━━━
✔ Installing frontend dependencies...
✔ Dependencies installed successfully (8.7s)
✔ Starting frontend server...
✔ Frontend server started at http://localhost:3000
✔ Testing health endpoint...
✔ Frontend is healthy and accessible
```

### Phase 6: Completion

Display final summary and next steps.

**Output Example:**

```
━━━ Setup Complete ━━━
🎉 Ares Car Rental setup completed successfully!

Your application is now running:
  - Backend:  http://localhost:5000
  - Frontend: http://localhost:3000
  - Swagger:  http://localhost:5000/swagger

Press Ctrl+C to stop all servers
```

---

## 🛠️ Development

### Running Quality Checks

```bash
cd scripts/setup

# Type checking
bun run typecheck

# Linting
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Code formatting
bun run format

# Check formatting
bun run format:check

# Spell checking (via cspell)
bunx cspell "**/*.ts"
```

### Development Workflow

1. **Make changes** to TypeScript files
2. **Run type checks**: `bun run typecheck`
3. **Run linter**: `bun run lint`
4. **Format code**: `bun run format`
5. **Test locally**: `bun run index.ts --debug`

### Adding New Features

#### Adding a New System Check

1. Create a new file in `checks/` (e.g., `checks/docker.ts`)
2. Export a check function that returns check result
3. Add export to `checks/index.ts`
4. Call the check in `index.ts` `runSystemChecks()` function

**Example:**

```typescript
// checks/docker.ts
export async function checkDocker(): Promise<DockerInfo> {
  try {
    const result = await $`docker --version`.text();
    return {
      installed: true,
      version: result.match(/(\d+\.\d+\.\d+)/)?.[1] ?? "unknown",
    };
  } catch {
    return { installed: false };
  }
}
```

#### Adding a New Configuration Option

1. Add the option to `config/backend-env.ts` or `config/frontend-env.ts`
2. Add validation to `lib/validators.ts`
3. Update the prompt in the respective config file
4. Add to the generated `.env` template

**Example:**

```typescript
// Add to prompts
{
  type: 'confirm',
  name: 'enableCache',
  message: 'Enable Redis cache?',
  initial: false,
}

// Add to .env template
ENABLE_CACHE=${config.enableCache ? 'true' : 'false'}
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Bun not found"

**Solution:**

```bash
# Windows
powershell -c "irm bun.sh/install.ps1|iex"

# Linux/macOS
curl -fsSL https://bun.sh/install | bash

# Restart terminal
```

#### ".NET SDK not found"

**Solution:**

```bash
# Download from: https://dotnet.microsoft.com/download
# Or use package manager:

# Ubuntu/Debian
sudo apt-get install -y dotnet-sdk-10.0

# macOS
brew install dotnet

# Windows
choco install dotnet-sdk
```

#### "Node.js version too old"

**Solution:**

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from: https://nodejs.org/
```

#### "SQL Server not accessible"

**Solution:**

**Option 1: Docker (Recommended)**

```bash
docker run -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 \
  --name mssql \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

**Option 2: Native Installation**

- Windows: [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-downloads)
- Linux: [SQL Server on Linux](https://learn.microsoft.com/sql/linux/sql-server-linux-setup)
- macOS: Use Docker (native SQL Server not available)

#### "Port already in use"

**Solution:**

The script will detect and offer to kill the process. Or manually:

```bash
# Linux/macOS
lsof -ti:5000 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

#### "Database migration failed"

**Solution:**

```bash
# Check connection string in backend/.env
# Verify SQL Server is running
# Try manual migration:
cd backend/Api
dotnet ef database update
```

#### "Backend build failed"

**Solution:**

```bash
# Check .NET SDK version
dotnet --version

# Try manual build
cd backend
dotnet restore
dotnet build
```

#### "Frontend dependencies failed"

**Solution:**

```bash
# Clear cache and retry
cd frontend
rm -rf node_modules bun.lockb
bun install
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
bun setup.ts --debug
```

This will show:

- Detailed command output
- Stack traces for errors
- Internal state information
- Timing information

### Getting Help

1. **Check logs**: Look for error messages in the console output
2. **Enable debug mode**: Run with `--debug` flag
3. **Check documentation**: Review this README and plan files
4. **Check issues**: Look for similar issues in the project repository
5. **Ask for help**: Create an issue with debug output

---

## 🧪 Testing

### Manual Testing

```bash
# Test system checks only
bun setup.ts --skip-db --skip-backend --skip-frontend

# Test configuration only
bun setup.ts --skip-checks --skip-db --skip-backend --skip-frontend

# Test database setup only
bun setup.ts --skip-checks --skip-backend --skip-frontend

# Test backend setup only
bun setup.ts --skip-checks --skip-db --skip-frontend

# Test frontend setup only
bun setup.ts --skip-checks --skip-db --skip-backend
```

### Automated Testing

```bash
# Run type checks
bun run typecheck

# Run linter
bun run lint

# Run all checks
bun run typecheck && bun run lint
```

### Integration Testing

Test the complete setup flow on a clean system:

```bash
# 1. Clean environment
rm -rf backend/.env frontend/.env.local
docker stop mssql && docker rm mssql

# 2. Start SQL Server
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Test@1234" \
  -p 1433:1433 --name mssql \
  -d mcr.microsoft.com/mssql/server:2022-latest

# 3. Run setup
bun setup.ts --quick

# 4. Verify services
curl http://localhost:5000/api/health
curl http://localhost:3000/api/health
```

---

## 📚 Technical Details

### Technology Stack

- **Runtime**: Bun (JavaScript runtime with built-in TypeScript support)
- **Language**: TypeScript (type-safe JavaScript)
- **CLI Libraries**:
  - `chalk`: Terminal colors
  - `ora`: Spinners and progress indicators
  - `prompts`: Interactive prompts
  - `zod`: Runtime type validation
- **Development Tools**:
  - ESLint: Code linting
  - Prettier: Code formatting
  - cspell: Spell checking

### Design Decisions

#### Why TypeScript + Bun?

1. **Single Codebase**: One implementation for all platforms (vs. separate bash/PowerShell scripts)
2. **Type Safety**: Catch errors at compile-time, not runtime
3. **Better DX**: IDE support, autocomplete, refactoring
4. **Modern APIs**: Async/await, native JSON, Web APIs
5. **Fast Execution**: Bun is 4x faster than Node.js
6. **Built-in TypeScript**: No compilation step needed

#### Why .NET for SQL Operations?

1. **.NET SDK Required**: Already needed for backend
2. **Native Support**: Best SQL Server support
3. **Type Safety**: Strongly typed queries
4. **No Extra Dependencies**: No need for npm SQL packages

#### Why Web Crypto API?

1. **Standard API**: Works in Bun, Node, browsers
2. **Secure**: Cryptographically secure random generation
3. **No Dependencies**: Built into runtime
4. **Future-Proof**: Standard web platform API

### Security Considerations

1. **Secret Generation**: Uses Web Crypto API for cryptographically secure random values
2. **File Permissions**: Sets `.env` files to 600 (owner read/write only) on Unix
3. **Password Handling**: Never logs passwords or secrets
4. **Input Validation**: All user input validated with Zod schemas
5. **SQL Injection**: Uses parameterized queries via .NET

### Performance Optimizations

1. **Parallel Checks**: System checks run in parallel where possible
2. **Lazy Loading**: Modules loaded only when needed
3. **Efficient Spawning**: Uses `Bun.spawn()` for process management
4. **Minimal Dependencies**: Only essential packages included
5. **Fast Runtime**: Bun's optimized JavaScript engine

---

## 📝 API Reference

### Logger Functions

```typescript
// Print banner
printBanner(): void

// Log step header
logStep(message: string): void

// Log messages
logInfo(message: string): void
logSuccess(message: string): void
logError(message: string): void
logWarn(message: string): void
logDebug(message: string): void

// Spinners
startSpinner(message: string): Ora
stopSpinner(success: boolean, message?: string): void
updateSpinner(message: string): void

// Debug mode
setDebugMode(enabled: boolean): void
```

### Utility Functions

```typescript
// OS detection
getOSType(): string
getArch(): string
isWindows(): boolean
isLinux(): boolean
isMacOS(): boolean

// File operations
fileExists(path: string): Promise<boolean>
directoryExists(path: string): Promise<boolean>
ensureDirectory(path: string): Promise<void>
backupFile(path: string): Promise<string>

// Port checking
isPortAvailable(port: number): Promise<boolean>
getProcessUsingPort(port: number): Promise<string | null>
killProcessOnPort(port: number): Promise<boolean>

// Random generation
generateRandomString(length: number): string
generateSecureSecret(bytes: number): string

// Prompts
promptUser(questions: PromptObject[]): Promise<Record<string, unknown>>
confirmAction(message: string): Promise<boolean>
```

### Validation Schemas

```typescript
// Backend .env schema
backendEnvSchema: z.ZodObject<{
  connectionString: z.ZodString;
  jwtSecret: z.ZodString;
  jwtIssuer: z.ZodString;
  jwtAudience: z.ZodString;
  // ... more fields
}>;

// Frontend .env.local schema
frontendEnvSchema: z.ZodObject<{
  nextAuthUrl: z.ZodString;
  nextAuthSecret: z.ZodString;
  nextPublicApiBaseUrl: z.ZodString;
  // ... more fields
}>;
```

---

## 🤝 Contributing

### Code Style

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use descriptive variable names

### Commit Guidelines

```bash
# Format: <type>: <description>

# Types:
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code formatting
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks

# Examples:
feat: Add Docker detection to system checks
fix: Handle SQL Server connection timeout
docs: Update troubleshooting guide
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks (`typecheck`, `lint`, `format`)
5. Test your changes
6. Submit a pull request

---

## 📄 License

See the [LICENSE](../../LICENSE) file in the root directory.

---

## 🔗 Related Documentation

- [Setup Plan](../../SETUP_SCRIPT_PLAN_TYPESCRIPT.md) - Detailed implementation plan
- [Implementation Status](../../SETUP_IMPLEMENTATION_STATUS.md) - Current progress
- [Quick Start Guide](../../SETUP_QUICK_START.md) - Quick reference
- [Approach Comparison](../../SETUP_APPROACH_COMPARISON.md) - Why TypeScript was chosen

---

**Last Updated:** 2026-04-16  
**Version:** 1.0.0  
**Status:** Production Ready
