# PowerShell script to split monorepo into separate repositories
# Run this from the root of your current proclubs-stats-hub directory

Write-Host "🚀 ProClubs Stats Hub - Repository Split Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend" -PathType Container) -or -not (Test-Path "frontend" -PathType Container)) {
    Write-Host "❌ Error: Please run this script from the root of proclubs-stats-hub directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Creating separate repositories..." -ForegroundColor Yellow

# Create backend repository
Write-Host "Creating backend repository..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "proclubs-stats-hub-backend" -Force | Out-Null
Copy-Item -Path "backend\*" -Destination "proclubs-stats-hub-backend\" -Recurse -Force
Copy-Item -Path "backend\.*" -Destination "proclubs-stats-hub-backend\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy specific files to backend root
Copy-Item -Path "backend-package.json" -Destination "proclubs-stats-hub-backend\package.json" -Force
Copy-Item -Path "backend\railway.json" -Destination "proclubs-stats-hub-backend\railway.json" -Force
Copy-Item -Path "backend\Procfile" -Destination "proclubs-stats-hub-backend\Procfile" -Force

Write-Host "✅ Backend repository created" -ForegroundColor Green

# Create frontend repository
Write-Host "Creating frontend repository..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "proclubs-stats-hub-frontend" -Force | Out-Null
Copy-Item -Path "frontend\*" -Destination "proclubs-stats-hub-frontend\" -Recurse -Force
Copy-Item -Path "frontend\.*" -Destination "proclubs-stats-hub-frontend\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy specific files to frontend root
Copy-Item -Path "frontend-package.json" -Destination "proclubs-stats-hub-frontend\package.json" -Force
Copy-Item -Path "frontend\vercel.json" -Destination "proclubs-stats-hub-frontend\vercel.json" -Force

Write-Host "✅ Frontend repository created" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create GitHub repositories:" -ForegroundColor White
Write-Host "   - proclubs-stats-hub-backend" -ForegroundColor Gray
Write-Host "   - proclubs-stats-hub-frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Initialize Git in each directory:" -ForegroundColor White
Write-Host "   cd proclubs-stats-hub-backend" -ForegroundColor Gray
Write-Host "   git init" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Initial backend commit'" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/yourusername/proclubs-stats-hub-backend.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   cd proclubs-stats-hub-frontend" -ForegroundColor Gray
Write-Host "   git init" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Initial frontend commit'" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git remote add origin https://github.com/yourusername/proclubs-stats-hub-frontend.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Connect to deployment platforms:" -ForegroundColor White
Write-Host "   - Backend: Connect to Railway" -ForegroundColor Gray
Write-Host "   - Frontend: Connect to Vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Update environment variables with new URLs" -ForegroundColor White
Write-Host ""
Write-Host "✅ Repository split completed!" -ForegroundColor Green
Write-Host "See SPLIT_REPOSITORY_GUIDE.md for detailed instructions" -ForegroundColor Cyan
