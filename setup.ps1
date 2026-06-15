# Spray Foam Estimator AI - Initial Setup Script
# Run this ONCE before `npm install` to clean up routing and configure the project

Write-Host "Setting up Spray Foam Estimator AI..." -ForegroundColor Cyan

# Remove conflicting (dashboard) route group - all pages are now under app/dashboard/
if (Test-Path "app\(dashboard)") {
    Write-Host "Removing conflicting (dashboard) route group..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "app\(dashboard)"
    Write-Host "  Done." -ForegroundColor Green
}

# Remove conflicting (auth) placeholder if needed
# (auth) group is fine as-is, no conflicts

# Copy .env.example to .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local from .env.example" -ForegroundColor Yellow
    Write-Host "  --> Edit .env.local with your API keys before running the app" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete! Next steps:" -ForegroundColor Green
Write-Host "  1. Edit .env.local with your API keys (Clerk, Anthropic, AWS, DATABASE_URL)"
Write-Host "  2. npm install"
Write-Host "  3. npx prisma db push"
Write-Host "  4. npx prisma db seed  (optional - loads default settings)"
Write-Host "  5. npm run dev"
Write-Host ""
Write-Host "Keys needed:" -ForegroundColor Cyan
Write-Host "  - Clerk:      https://clerk.com (free)"
Write-Host "  - Anthropic:  https://console.anthropic.com"
Write-Host "  - AWS S3:     https://aws.amazon.com/s3"
Write-Host "  - Postgres:   Neon (free) https://neon.tech or local"
