#!/bin/bash

# ProClubs Stats Hub - Production Deployment Script
# This script helps deploy both frontend and backend to production

set -e

echo "🚀 ProClubs Stats Hub - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Deploy backend to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    cd backend
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway if not already logged in
    if ! railway whoami &> /dev/null; then
        print_warning "Please login to Railway:"
        railway login
    fi
    
    # Deploy to Railway
    railway up --detach
    
    print_status "Backend deployed to Railway"
    cd ..
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    cd frontend
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Login to Vercel if not already logged in
    if ! vercel whoami &> /dev/null; then
        print_warning "Please login to Vercel:"
        vercel login
    fi
    
    # Build and deploy
    npm run build
    vercel --prod
    
    print_status "Frontend deployed to Vercel"
    cd ..
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd backend
    
    # Run migrations on Railway
    railway run npm run db:migrate:deploy
    
    print_status "Database migrations completed"
    cd ..
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Check dependencies
    check_dependencies
    
    # Deploy backend
    deploy_backend
    
    # Run migrations
    run_migrations
    
    # Deploy frontend
    deploy_frontend
    
    echo ""
    print_status "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update CORS_ORIGIN in Railway with your Vercel URL"
    echo "2. Update REACT_APP_API_URL in Vercel with your Railway URL"
    echo "3. Test your application"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@"
