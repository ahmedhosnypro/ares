# Ares Car Rental

A modern, full-stack car rental platform built with .NET, Next.js, and SQL Server.

## 🚀 Quick Start

### Prerequisites

- **Bun** ≥1.0 - [Install](https://bun.sh)
- **.NET SDK** ≥10.0 - [Download](https://dotnet.microsoft.com/download)
- **Node.js** ≥18.0 (optional, recommended for some tooling) - [Download](https://nodejs.org/)
- **SQL Server** - Docker or [Native Install](https://www.microsoft.com/sql-server)

### Automated Setup (Recommended)

```bash
# Install dependencies and run setup
bun run deps
bun run setup
```

The script will:
- Check system requirements
- Generate configuration files (asks for all values interactively)
- Setup and seed the database
- Build and start backend + frontend

**Options:**
```bash
bun run setup          # Interactive (asks for all values)
bun run setup:quick    # Quick setup with defaults
```

---

## 📖 Manual Setup

### 1. SQL Server

**Docker:**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
dotnet restore
cd Api
dotnet ef database update
dotnet run
```

Backend: http://localhost:5000

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your configuration
bun install
bun run dev
```

Frontend: http://localhost:3000

---

## 🏗️ Project Structure

```
ares-car-rental/
├── backend/                 # .NET Backend API
│   ├── Api/                 # Web API + Controllers
│   ├── Application/         # Business logic + Services
│   ├── Domain/              # Domain models
│   └── Infrastructure/      # Data access + Repositories
├── frontend/                # Next.js Frontend
│   ├── app/                 # App router pages
│   └── src/                 # Components + Utils
└── scripts/setup/           # Automated setup script
```

---

## 🛠️ Technology Stack

**Backend:** .NET 10, ASP.NET Core, EF Core, SQL Server, AutoMapper, FluentValidation, Serilog  
**Frontend:** Next.js 15, React 19, TypeScript, NextAuth.js, Tailwind CSS, Radix UI  
**Tools:** Bun, Docker, ESLint, Prettier

---

## 📦 Root Package Scripts

```bash
# Dependencies
bun run deps              # Install all subproject dependencies

# Setup
bun run setup             # Interactive setup (asks for all values)
bun run setup:quick       # Quick setup with defaults

# Development
bun run dev               # Start frontend dev server
bun run build             # Build frontend
bun run start             # Start frontend production server

# Code Quality
bun run lint              # Lint all projects
bun run format            # Format all projects
bun run typecheck         # Type check all projects
bun run test              # Run tests
```

**⚠️ Package Installation:**
```bash
# ❌ Don't install at root
bun add some-package

# ✅ Install in subprojects
cd frontend && bun add some-package
cd scripts/setup && bun add some-package
```

---

## 🔧 Development

**Backend:**
```bash
cd backend/Api
dotnet watch run                    # Hot reload
dotnet ef migrations add Name       # New migration
dotnet ef database update           # Apply migrations
```

**Frontend:**
```bash
cd frontend
bun run dev                         # Dev server
bun run typecheck                   # Type check
bun run lint                        # Lint
```

---

## 📖 API Documentation

**Swagger UI:** http://localhost:5000/swagger

**Health Endpoints:**
- Backend: `GET http://localhost:5000/api/health`
- Frontend: `GET http://localhost:3000/api/health`

---

## 🐛 Troubleshooting

**Port in use:**
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**Database connection failed:**
```bash
# Check SQL Server is running
docker ps | grep mssql

# Verify connection in backend/.env
# Test with: cd backend/Api && dotnet ef database update
```

**Build failed:**
```bash
# Backend
cd backend && dotnet clean && dotnet restore && dotnet build

# Frontend
cd frontend && rm -rf node_modules .next && bun install && bun run build
```

---

## 🚀 Deployment

**Backend:**
```bash
cd backend
dotnet publish -c Release -o ./publish
dotnet ef database update --connection "PRODUCTION_CONNECTION_STRING"
cd publish && dotnet Api.dll
```

**Frontend:**
```bash
cd frontend
bun run build
bun run start
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 📞 Support

- **Documentation:** [Setup Script Docs](scripts/setup/README.md)
- **Issues:** GitHub Issues

---

**Made with ❤️ by the Ares Team**
