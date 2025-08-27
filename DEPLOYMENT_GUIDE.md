# 🚀 Deployment Guide - ProClubs Stats Hub

This guide covers deploying your full-stack application to production using Vercel (frontend) and Railway (backend + database).

## 📋 Prerequisites

- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) 18+ installed
- [Vercel CLI](https://vercel.com/cli) (optional)
- [Railway CLI](https://railway.app/cli) (optional)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional)

## 🎯 **Option 1: Vercel + Railway (Recommended)**

### **Step 1: Deploy Backend to Railway**

1. **Sign up for Railway** at [railway.app](https://railway.app)
2. **Create a new project** and select "Deploy from GitHub repo"
3. **Connect your repository** and select the `backend` folder
4. **Add environment variables**:

   ```bash
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   PORT=3000
   ```

5. **Deploy PostgreSQL database**:

   - In Railway dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Copy the connection string to `DATABASE_URL`

6. **Run database migrations**:

   ```bash
   # In Railway dashboard terminal or locally with DATABASE_URL
   npm run db:migrate
   npm run db:generate
   ```

7. **Deploy your backend** - Railway will automatically build and deploy

### **Step 2: Deploy Frontend to Vercel**

1. **Sign up for Vercel** at [vercel.com](https://vercel.com)
2. **Import your repository** from GitHub
3. **Configure build settings**:

   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add environment variables**:

   ```bash
   REACT_APP_API_URL=https://your-railway-backend-url.railway.app
   ```

5. **Deploy** - Vercel will automatically build and deploy

## 🎯 **Option 2: Render (Alternative)**

### **Deploy Both to Render**

1. **Sign up for Render** at [render.com](https://render.com)
2. **Create Web Service** for backend:

   - Build Command: `npm install && npm run db:generate`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Create Web Service** for frontend:

   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Create PostgreSQL database** on Render

## 🎯 **Option 3: Vercel + Supabase (Database + Edge Functions)**

### **Step 1: Set Up Supabase Database**

1. **Sign up for Supabase** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your database connection string** from Settings → Database
4. **Install Supabase CLI** (optional):
   ```bash
   npm install -g supabase
   ```

### **Step 2: Deploy Backend as Supabase Edge Functions**

1. **Create Supabase functions directory**:

   ```bash
   mkdir supabase/functions
   ```

2. **Convert your Express routes to Edge Functions**:

   - Each route becomes a separate function
   - Functions run on Deno runtime
   - Use Supabase's built-in auth and database

3. **Deploy functions**:
   ```bash
   supabase functions deploy
   ```

### **Step 3: Deploy Frontend to Vercel**

Same as Option 1, but point to your Supabase project URL.

## 🔧 **Environment Configuration**

### **Backend Environment Variables**

Create `.env` file in `backend/`:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
NODE_ENV="production"
PORT=3000

# CORS (update with your frontend URL)
CORS_ORIGIN="https://your-frontend-domain.vercel.app"
```

### **Frontend Environment Variables**

Create `.env` file in `frontend/`:

```bash
# API Configuration
REACT_APP_API_URL="https://your-backend-url.railway.app"
REACT_APP_ENVIRONMENT="production"
```

### **Supabase Environment Variables**

```bash
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 🚀 **Deployment Commands**

### **Backend (Railway)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up

# View logs
railway logs
```

### **Frontend (Vercel)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### **Supabase**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy

# Deploy database migrations
supabase db push
```

## 📊 **Post-Deployment Checklist**

- [ ] Backend health check endpoint responds (`/health`)
- [ ] Database migrations completed successfully
- [ ] Frontend can connect to backend API
- [ ] Environment variables are properly set
- [ ] CORS is configured for production domains
- [ ] SSL certificates are working
- [ ] Monitoring and logging are set up

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Database Connection Failed**

   - Check `DATABASE_URL` format
   - Verify database is running
   - Check firewall/network settings

2. **CORS Errors**

   - Update CORS origin in backend
   - Ensure frontend URL is correct

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`
   - Check for syntax errors

### **Supabase-Specific Issues**

1. **Edge Function Errors**

   - Check Deno compatibility
   - Verify function imports
   - Check Supabase client initialization

2. **Database Connection Issues**
   - Verify connection string format
   - Check RLS policies
   - Ensure proper permissions

### **Useful Commands**

```bash
# Check backend logs
railway logs

# Check frontend build
vercel logs

# Test database connection
npm run db:studio

# Run migrations
npm run db:migrate

# Supabase commands
supabase functions logs
supabase db reset
supabase status
```

## 💰 **Cost Estimation**

- **Vercel**: Free tier (100GB bandwidth/month)
- **Railway**: $5/month for basic plan
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Total**: $0-5/month depending on usage

## 🆘 **Need Help?**

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Create React App Deployment](https://create-react-app.dev/docs/deployment/)
