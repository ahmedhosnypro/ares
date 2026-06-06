# Ares Car Rental

A modern, full-stack car rental platform built with .NET, Next.js, and SQL Server.

## 🚀 Quick Start

### Prerequisites

- **Bun** ≥1.0 - [Install](https://bun.sh)
- **.NET SDK** ≥10.0 - [Download](https://dotnet.microsoft.com/download)
- **Node.js** ≥18.0 (optional, recommended for some tooling) - [Download](https://nodejs.org/)
- **SQL Server** - Docker or [Native Install](https://www.microsoft.com/sql-server)
- **ngrok** - [Install](https://ngrok.com/download) (optional, for Paymob webhooks)

### Automated Setup (Recommended)

```bash
# Install dependencies and run setup
bun run deps
bun run setup
```

The script will:

- Check system requirements (including **ngrok**)
- Generate configuration files (asks for all values interactively)
- Setup and seed the database
- Build and start backend + frontend

**Options:**

```bash
bun run setup          # Interactive (asks for all values, including Paymob)
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

### 4. Paymob Payment Gateway (Optional)

The project supports **Paymob** for payment processing. To enable payments:

#### A. Sign Up for Paymob Sandbox

1. Register at: https://accept.paymob.com/portal2/en/register
2. Login to dashboard: https://accept.paymob.com/portal2/en/login

#### B. Get Your Credentials

Collect these 4 values from your Paymob dashboard:

1. **API Key** (Settings → Account Info)
2. **Integration ID** (Settings → Payment Integrations → Online Card)
3. **iFrame ID** (Payment Integrations section)
4. **HMAC Secret** (Settings → Security Settings)

#### C. Set Up ngrok for Webhooks

Since the backend runs on `localhost`, Paymob needs a public URL to reach it:

1. **Start ngrok**: `npx ngrok http 5000`
2. **Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok.io`)
3. **Configure Callbacks in Paymob Dashboard**:
   - **Transaction Processed Callback**: `https://YOUR_NGROK_URL/api/payments/callback`
   - **Transaction Response Callback**: `https://YOUR_NGROK_URL/api/payments/webhook`

#### D. Test Payment Flow

- **Success Card**: `4987654321098769` (any CVV, future expiry)
- **Decline Card**: `5123456789012346`
- **Cancellation**: Test refund previews and admin overrides.

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

## ✨ Features

- **Public Operations**: Vehicle search, details, availability, pricing, reviews.
- **Admin Fleet Management**: Full CRUD for vehicles via dedicated endpoints. Secure role-based operations and active booking validation.
- **Admin Supplier Management**: Full CRUD for suppliers including paginated lists, detailed views, creation, updates, and soft deletion.
- **Dynamic Pricing**: Calculation with insurance and additional services.
- **🔔 Notifications**: Real-time platform-wide admin fan-out alerts and a dedicated management dashboard.

---

## 🛠️ Technology Stack

**Backend:** .NET 10, ASP.NET Core, EF Core, SQL Server, AutoMapper, FluentValidation, Serilog  
**Frontend:** Next.js 15, React 19, TypeScript, NextAuth.js, Tailwind CSS, Radix UI  
**Tools:** Bun, Docker, ESLint, Prettier, ngrok

---

## 📦 Root Package Scripts

```bash
# Dependencies
bun run deps              # Install all subproject dependencies

# Setup
bun run setup             # Interactive setup
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

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 📞 Support

- **Documentation:** [Setup Script Docs](scripts/setup/README.md)
- **Issues:** GitHub Issues

---

**Made with ❤️ by the Ares Team**
