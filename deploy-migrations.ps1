# Quick Deploy Script for Unified Visitors Migrations
# Run this: .\deploy-migrations.ps1

Write-Host "🚀 Deploying Unified Visitors Migrations..." -ForegroundColor Cyan

# Get Supabase connection details
$PROJECT_REF = "cxmkdtgfocgbfizawlwa"
$DB_PASSWORD = Read-Host "Enter your Supabase database password" -AsSecureString
$DB_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Connection string
$CONNECTION_STRING = "postgresql://postgres:$DB_PASSWORD_TEXT@db.$PROJECT_REF.supabase.co:5432/postgres"

Write-Host "📊 Running Migration 1: unified_visitors schema..." -ForegroundColor Yellow
Get-Content "supabase\migrations\20260210_unified_visitors.sql" | psql $CONNECTION_STRING

Write-Host "⚙️  Running Migration 2: unified_visitors functions..." -ForegroundColor Yellow
Get-Content "supabase\migrations\20260210_unified_visitors_functions.sql" | psql $CONNECTION_STRING

Write-Host "✅ Done! Verifying tables..." -ForegroundColor Green
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%visitor%';" | psql $CONNECTION_STRING

Write-Host "`n🎉 Migrations deployed successfully!" -ForegroundColor Green
