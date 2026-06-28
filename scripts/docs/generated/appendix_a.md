# APPENDIX A: APPENDICES  

## A.1 File Structure  

The repository follows a clear, layered organization that separates concerns between the **backend**, **frontend**, **development tooling**, and **documentation**. The hierarchy is described below.  

### Root‑level directories and their purposes  

| Directory / File | Description |
|------------------|-------------|
| `.devcontainer/` | Docker‑based development environment definition (Dockerfile, docker‑compose, VS Code extensions). |
| `.github/` | GitHub Actions workflow for continuous integration (`ci.yml`). |
| `.husky/` | Git‑hook scripts that enforce frontend and backend quality checks before a commit. |
| `backend/` | Source code of the ASP.NET Core Web API, structured according to Clean Architecture (Api, Application, Domain, Infrastructure, Tests, and a small console utility). |
| `frontend/` | Next.js 15 application (React 19) that implements the user‑facing UI. |
| `scripts/` | Automation scripts written in TypeScript and executed with **Bun**. Sub‑folders contain: |
|  `setup/` | End‑to‑end project setup, system checks, configuration generation, database migration, and server orchestration. |
|  `docs/` | Documentation generation pipeline (AI‑assisted chapter creation). |
| `README.md` | High‑level project overview, quick‑start guide and command reference. |
| `package.json` | Root npm/Bun manifest that defines top‑level scripts (e.g., `bun run deps`, `bun run dev`). |
| `run-ci-tests.ps1` | PowerShell script used by CI to verify formatting, linting, build, and test of both frontend and backend. |
| `.gitignore` | Files and directories excluded from version control. |

### Backend structure and key files  

```
backend/
├─ Api/                # ASP.NET Core entry point (controllers, Swagger, health endpoints)
│   └─ Api.csproj      # Web API project file (targets .NET 10)
├─ Application/       # Business‑logic services, MediatR handlers, AutoMapper profiles
│   └─ Application.csproj
├─ Domain/            # Core domain entities and interfaces
│   └─ Domain.csproj
├─ Infrastructure/     # EF Core DbContext, repository implementations, identity integration
│   └─ Infrastructure.csproj
├─ Tests/              # xUnit test project covering API, services and EF Core in‑memory tests
│   └─ Tests.csproj
├─ phonetest/          # Small console app demonstrating libphonenumber‑csharp usage
│   └─ phonetest.csproj
└─ *.slnx              # Solution file (referenced by CI scripts)
```

*Key configuration files*  

- `backend/Api/appsettings.json` (not listed but typical) – holds runtime settings.  
- `backend/.env.example` – template for environment variables required by the API.  

### Frontend structure and key files  

```
frontend/
├─ app/                # Next.js App Router pages (route handlers, API routes)
├─ src/                # Reusable React components, hooks, utilities
├─ public/             # Static assets (images, favicons)
├─ .env.example        # Template for environment variables consumed by NextAuth and API client
├─ package.json         # Frontend dependencies and scripts (dev, build, lint, test)
└─ next.config.js      # Next.js configuration (custom webpack, redirects, etc.)
```

### Configuration files and their roles  

| File | Role |
|------|------|
| `.devcontainer/devcontainer.json` | VS Code dev‑container definition; forwards ports 3000 (frontend), 5000/5001 (backend HTTPS), 1433 (SQL Server). |
| `.devcontainer/docker-compose.yml` | Defines two services: the development container and an MSSQL Server container. |
| `.devcontainer/Dockerfile` | Extends the official .NET dev‑container image and installs additional tools (git, curl, etc.). |
| `scripts/setup/.env` (generated) | Backend environment variables (connection string, JWT secrets, Paymob credentials, etc.). |
| `frontend/.env.local` (generated) | Frontend environment variables (NextAuth URL/secret, API base URL, feature toggles). |
| `scripts/setup/config/*.ts` | TypeScript modules that generate, validate and write the above `.env` files. |
| `scripts/setup/checks/*.ts` | System‑requirement checks (Bun, .NET, Node, SQL Server, ports, ngrok). |
| `scripts/setup/backend/*.ts` | Functions to restore packages, build, start, stop and test the .NET API. |
| `scripts/setup/frontend/*.ts` | Functions to install dependencies, start, stop and test the Next.js UI. |
| `scripts/setup/database/*.ts` | Database connection verification, EF Core migrations, seeding and verification utilities. |
| `scripts/docs/*.ts` | Documentation generation utilities (AI client, token budgeting, repomix packing). |
| `run-ci-tests.ps1` | Windows PowerShell script executed by CI to ensure formatting, linting, build and test succeed. |

### Scripts and tooling  

| Script / Tool | Description |
|---------------|-------------|
| `bun run deps` | Installs all required dependencies for `scripts/setup`, `frontend` and `scripts/docs`. |
| `bun run setup` | Interactive full‑stack setup (system checks, env generation, DB migration, server start). |
| `bun run setup:quick` | Non‑interactive setup that uses default values. |
| `bun run dev` | Starts the Next.js development server (`frontend`). |
| `bun run build` | Produces a production‑ready Next.js build. |
| `bun run start` | Starts the compiled Next.js server (production mode). |
| `bun run lint`, `bun run format`, `bun run typecheck` | Code‑quality commands for both frontend and setup scripts. |
| `dotnet restore / build / test` | .NET CLI commands used by the setup scripts and CI workflow. |
| `docker compose up` (via devcontainer) | Launches the development container together with an MSSQL Server instance. |
| `ngrok` (optional) | Provides a public HTTPS tunnel for Paymob webhook testing. |

---

## A.2 System Requirements  

| Component | Minimum Version | Acquisition |
|-----------|------------------|--------------|
| **Operating System** | Windows 10 64‑bit, macOS 12+, or any recent Linux distribution (Ubuntu 20.04+, Debian, Fedora) | Pre‑installed on the host. |
| **Docker** | Engine 20.10+ (required for devcontainer and optional SQL Server container) | <https://docs.docker.com/get-docker/> |
| **Bun** | ≥ 1.0.0 | <https://bun.sh> (install script provided on the website). |
| **Node.js** | ≥ 18.0 (used by some tooling) | <https://nodejs.org/> |
| **.NET SDK** | 10.0.x (includes `dotnet` CLI) | <https://dotnet.microsoft.com/download> |
| **SQL Server** | 2022 Express or later (Docker image `mcr.microsoft.com/mssql/server:2022-latest`) | Docker pull or native installer from Microsoft. |
| **ngrok** (optional, for Paymob webhook) | Latest release | <https://ngrok.com/download> |
| **Git** | 2.30+ (required for version control) | <https://git-scm.com/downloads> |
| **VS Code** (recommended) | 1.90+ with Remote‑Containers extension | <https://code.visualstudio.com/> |

*All tools must be available on the system `PATH`. The setup script validates their presence and version before proceeding.*

---

## A.3 Installation and Setup  

The following procedure assumes a fresh workstation (or a clean CI runner). Adjust the steps for an existing environment as needed.  

### 1. Prerequisites installation  

1. **Install Docker** – follow the official guide for your OS; verify with `docker version`.  
2. **Install Bun** – run the installer script: `curl -fsSL https://bun.sh/install | bash` (Linux/macOS) or the PowerShell equivalent for Windows. After installation, confirm with `bun --version`.  
3. **Install Node.js** – use the official installer or a version manager (`nvm`, `fnm`). Verify with `node --version`.  
4. **Install .NET SDK 10** – download the installer from Microsoft, then run `dotnet --version` to confirm.  
5. **(Optional) Install ngrok** – download the binary, place it in a directory on `PATH`, and test with `ngrok version`.  

### 2. Clone the repository  

```bash
git clone https://github.com/your-org/ares-car-rental.git
cd ares-car-rental
```

### 3. Generate and install project dependencies  

```bash
# Install all workspace‑level dependencies
bun run deps
```

The command executes the following internally:  

- `scripts/setup/bun install` – installs TypeScript tooling for the setup scripts.  
- `frontend/bun install` – installs the Next.js dependencies.  
- `scripts/docs/bun install` – installs documentation‑generation packages.  

### 4. Configure environment variables  

The setup script creates the required `.env` files automatically. You may run it in **interactive** mode to supply custom values (recommended for production) or in **quick** mode to accept defaults.  

#### Interactive mode  

```bash
bun run setup
```

The script will:  

- Detect the operating system and Docker context.  
- Prompt for SQL Server connection details, JWT secrets, Paymob credentials, Google OAuth IDs, etc.  
- Write `backend/.env` and `frontend/.env.local`.  
- Back up any existing files (`.env.bak`, `.env.local.bak`).  

#### Quick mode (all defaults)  

```bash
bun run setup:quick
```

All secrets are generated automatically; default database credentials (`SA_PASSWORD=YourPassword123!`) are used unless overridden later.  

### 5. Database setup  

The backend uses Entity Framework Core migrations. The setup script performs the following automatically:  

1. **Test SQL Server connectivity** – attempts a TCP connection to `localhost:1433`.  
2. **Run pending migrations** – executes `dotnet ef database update` inside the `backend/Api` project.  
3. **Seed demo data** – starts the API with `SEED_DEMO_DATA=true` to insert sample vehicles, users and suppliers.  

If you prefer to perform these steps manually:  

```bash
# Ensure MSSQL container is running (Docker)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest

# Restore .NET packages
dotnet restore backend/Ares.slnx

# Apply migrations
cd backend/Api
dotnet ef database update

# Seed data (optional)
dotnet run --project ../../phonetest/phonetest.csproj --seed-only   # example command
```

### 6. Build and run the backend  

```bash
# Restore NuGet packages (handled by the setup script)
dotnet restore backend/Ares.slnx

# Build in Release configuration
dotnet build backend/Ares.slnx --configuration Release --no-restore

# Start the API (default ports 5000/5001)
dotnet run --project backend/Api/Api.csproj
```

Alternatively, use the provided helper script:  

```bash
bun run scripts/setup/backend/start.ts   # starts the API and returns the process handle
```

The API will be reachable at **http://localhost:5000** (HTTP) and **https://localhost:5001** (HTTPS). Swagger UI is available at `/swagger`.  

### 7. Build and run the frontend  

```bash
# Install dependencies (already done by `bun run deps`, repeat if needed)
bun install   # executed inside the `frontend` folder

# Development server
bun run dev   # starts Next.js on http://localhost:3000

# Production build
bun run build   # creates the `.next` directory

# Production server
bun run start   # serves the built application
```

The frontend reads `frontend/.env.local` for the API base URL and NextAuth configuration.  

### 8. Verify health endpoints  

- Backend health: `curl http://localhost:5000/api/health` (should return a JSON status).  
- Frontend health (custom endpoint defined in the app): `curl http://localhost:3000/api/health`.  

If both respond with HTTP 200, the stack is operational.  

---

## A.4 Running the Application  

The following sequence launches the complete system in a single terminal session.  

1. **Start SQL Server** (if not already running):  

   ```bash
   docker start mssql   # or the `docker run` command shown earlier
   ```  

2. **Start the backend** (using the helper script):  

   ```bash
   bun run scripts/setup/backend/start.ts
   ```  

   The script prints the backend URL (e.g., `http://localhost:5000`).  

3. **Start the frontend** (development mode):  

   ```bash
   bun run scripts/setup/frontend/start.ts
   ```  

   The script prints the frontend URL (e.g., `http://localhost:3000`).  

4. **Optional – expose webhook endpoint** (Paymob testing):  

   ```bash
   ngrok http 5000   # creates a public URL like https://abcd1234.ngrok.io
   ```  

   Update the Paymob webhook URL in the backend `.env` with the generated ngrok address, then restart the backend.  

5. **Access the UI** – open a web browser and navigate to the printed frontend URL.  

6. **Stop the services** – press `Ctrl+C` in each terminal, or run the stop helpers:  

   ```bash
   bun run scripts/setup/backend/stop.ts
   bun run scripts/setup/frontend/stop.ts
   ```  

---

## A.5 Development and Testing  

### 5.1 Development workflow  

| Phase | Recommended command(s) | Description |
|-------|--------------------------|-------------|
| **Code editing** | Use VS Code with the dev‑container (`Remote‑Containers: Open Folder in Container`). | All required extensions (C#, .NET Runtime, ESLint, Prettier, etc.) are installed automatically. |
| **Backend** | `dotnet watch run --project backend/Api/Api.csproj` | Hot‑reload for API changes. |
| **Frontend** | `bun run dev` (or `bun run scripts/setup/frontend/start.ts`) | Starts Next.js with fast refresh. |
| **Database migrations** | `bun run scripts/setup/database/migrations.ts` | Generates or applies EF Core migrations. |
| **Seeding** | `bun run scripts/setup/database/seed.ts` | Inserts demo data; useful after resetting the DB. |

### 5.2 Running tests  

- **Backend unit & integration tests**  

  ```bash
  dotnet test backend/Ares.slnx --configuration Release
  ```  

- **Frontend end‑to‑end tests (Playwright)**  

  ```bash
  bun run test:e2e          # runs Playwright suite
  bun run test:e2e:ui      # opens the UI test runner
  ```  

- **Setup script tests**  

  ```bash
  bun run test               # executes the test suite located in scripts/setup
  ```  

### 5.3 Code quality tools  

| Tool | Command | Purpose |
|------|----------|---------|
| **ESLint** (frontend & setup) | `bun run lint` | Detects JavaScript/TypeScript linting issues. |
| **Prettier** | `bun run format` | Enforces consistent code formatting. |
| **Type‑checking** (tsgo) | `bun run typecheck` | Runs the native TypeScript compiler without emitting files. |
| **cspell** | `bunx cspell "**/*.ts"` | Spell‑checks source files and documentation. |
| **CI script** | `run-ci-tests.ps1` (Windows) or the GitHub Actions workflow | Executes formatting, lint, build and test steps automatically. |

All quality commands are defined in the respective `package.json` scripts and can be invoked from the repository root.  

### 5.4 Continuous Integration  

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that performs the following on every push or pull request:  

1. **Frontend** – installs Bun, caches dependencies, checks formatting, runs `tsgo`, builds the Next.js app.  
2. **Backend** – installs the .NET SDK, restores NuGet packages, builds the solution, and runs the xUnit test suite.  

The CI pipeline ensures that any contribution respects the project's coding standards and passes all automated tests before merging.  

---  

*End of Appendix A.*