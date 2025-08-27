#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if required tools are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend built successfully"
cd ..

# Test backend
echo "🧪 Testing backend..."
cd backend
npm install
npm run db:generate
echo "✅ Backend setup completed"
cd ..

echo ""
echo "🎉 Build process completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend to Railway:"
echo "   - Go to railway.app"
echo "   - Create new project from GitHub repo"
echo "   - Select backend folder"
echo "   - Add environment variables"
echo "   - Deploy PostgreSQL database"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Import your GitHub repo"
echo "   - Set root directory to 'frontend'"
echo "   - Add REACT_APP_API_URL environment variable"
echo "   - Deploy"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
