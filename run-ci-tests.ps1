$ErrorActionPreference = "Continue"
Write-Host "=== Frontend format:check ==="
bun run --cwd frontend format:check
if ($LASTEXITCODE -ne 0) { Write-Host "❌ format:check failed"; exit 1 }

Write-Host "=== Frontend tsgo ==="
bun run --cwd frontend tsgo
if ($LASTEXITCODE -ne 0) { Write-Host "❌ tsgo failed"; exit 1 }

Write-Host "=== Frontend lint ==="
bun run --cwd frontend lint
if ($LASTEXITCODE -ne 0) { Write-Host "❌ lint failed"; exit 1 }

Write-Host "=== Frontend build ==="
bun run --cwd frontend build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ frontend build failed"; exit 1 }

Write-Host "=== Backend restore ==="
dotnet restore backend/Ares.slnx
if ($LASTEXITCODE -ne 0) { Write-Host "❌ backend restore failed"; exit 1 }

Write-Host "=== Backend build ==="
dotnet build backend/Ares.slnx --no-restore --configuration Release
if ($LASTEXITCODE -ne 0) { Write-Host "❌ backend build failed"; exit 1 }

Write-Host "=== Backend test ==="
dotnet test backend/Ares.slnx --no-build --configuration Release --verbosity normal
if ($LASTEXITCODE -ne 0) { Write-Host "❌ backend test failed"; exit 1 }

Write-Host "✅ All tests passed successfully!"
