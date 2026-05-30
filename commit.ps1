git add "backend/Api/Controllers/AuthController.cs" "backend/Api/Program.cs" "backend/Application/Application.csproj" "backend/Domain/Entities/ApplicationUser.cs" "backend/Infrastructure/Data/Configurations/ApplicationUserConfiguration.cs" "backend/Infrastructure/Migrations/" "backend/Application/DTOs/Auth/" "backend/Application/Services/"
git commit -m "feat(backend): implement Google Auth services, DTOs, and migrations"

git add "backend/Api/appsettings.Development.json" "backend/Api/appsettings.json" "backend/.env.example"
git commit -m "config(backend): update configuration for Google Auth"

git add "frontend/app/(auth)/_components/" "frontend/app/(auth)/sign-in/SignInForm.tsx" "frontend/app/api/auth/"
git commit -m "feat(frontend): integrate Google Auth with NextAuth and UI"

git add "frontend/app/(auth)/sign-up/SignUpForm.tsx"
git commit -m "style(frontend): format code using prettier and fix lint errors"

git add "run-ci-tests.ps1"
git commit -m "test: add powershell script for running CI checks locally"
