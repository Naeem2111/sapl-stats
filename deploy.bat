@echo off
REM ProClubs Stats Hub - Production Deployment Script (Windows)
REM This script helps deploy both frontend and backend to production

echo 🚀 ProClubs Stats Hub - Production Deployment
echo ==============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Dependencies check passed
echo.

REM Deploy backend to Railway
echo 📦 Deploying backend to Railway...
cd backend

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Railway CLI not found. Installing...
    npm install -g @railway/cli
)

REM Login to Railway if not already logged in
railway whoami >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Please login to Railway:
    railway login
)

REM Deploy to Railway
railway up --detach

echo ✅ Backend deployed to Railway
cd ..

REM Run database migrations
echo 🗄️  Running database migrations...
cd backend
railway run npm run db:migrate:deploy
echo ✅ Database migrations completed
cd ..

REM Deploy frontend to Vercel
echo 🌐 Deploying frontend to Vercel...
cd frontend

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Login to Vercel if not already logged in
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Please login to Vercel:
    vercel login
)

REM Build and deploy
npm run build
vercel --prod

echo ✅ Frontend deployed to Vercel
cd ..

echo.
echo ✅ Deployment completed successfully!
echo.
echo Next steps:
echo 1. Update CORS_ORIGIN in Railway with your Vercel URL
echo 2. Update REACT_APP_API_URL in Vercel with your Railway URL
echo 3. Test your application
echo.
echo For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
pause
