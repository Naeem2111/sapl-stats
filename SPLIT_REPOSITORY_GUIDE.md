# Repository Split Guide

## 🎯 Recommended Structure

### Repository 1: `proclubs-stats-hub-backend`

```
proclubs-stats-hub-backend/
├── src/
├── prisma/
├── package.json
├── railway.json
├── Procfile
├── README.md
└── .env.example
```

### Repository 2: `proclubs-stats-hub-frontend`

```
proclubs-stats-hub-frontend/
├── src/
├── public/
├── package.json
├── vercel.json
├── README.md
└── .env.example
```

## 📋 Migration Steps

### Step 1: Create Backend Repository

1. **Create new GitHub repository**: `proclubs-stats-hub-backend`
2. **Copy backend files**:

   ```bash
   # Create new directory
   mkdir proclubs-stats-hub-backend
   cd proclubs-stats-hub-backend

   # Copy backend files
   cp -r ../proclubs-stats-hub/backend/* .
   cp ../proclubs-stats-hub/backend/.* . 2>/dev/null || true
   ```

3. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial backend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/proclubs-stats-hub-backend.git
   git push -u origin main
   ```

### Step 2: Create Frontend Repository

1. **Create new GitHub repository**: `proclubs-stats-hub-frontend`
2. **Copy frontend files**:

   ```bash
   # Create new directory
   mkdir proclubs-stats-hub-frontend
   cd proclubs-stats-hub-frontend

   # Copy frontend files
   cp -r ../proclubs-stats-hub/frontend/* .
   cp ../proclubs-stats-hub/frontend/.* . 2>/dev/null || true
   ```

3. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial frontend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/proclubs-stats-hub-frontend.git
   git push -u origin main
   ```

## 🔧 Updated Deployment Configuration

### Backend Repository (Railway)

- Connect `proclubs-stats-hub-backend` to Railway
- Root directory: `/` (root of repository)
- Build command: `npm run build`
- Start command: `npm start`

### Frontend Repository (Vercel)

- Connect `proclubs-stats-hub-frontend` to Vercel
- Root directory: `/` (root of repository)
- Build command: `npm run build`
- Output directory: `build`

## 📁 Files to Move

### Backend Repository

```
Move these files to backend repo root:
├── backend/src/ → src/
├── backend/prisma/ → prisma/
├── backend/package.json → package.json
├── backend/railway.json → railway.json
├── backend/Procfile → Procfile
├── backend/.env.example → .env.example
└── backend/README.md → README.md
```

### Frontend Repository

```
Move these files to frontend repo root:
├── frontend/src/ → src/
├── frontend/public/ → public/
├── frontend/package.json → package.json
├── frontend/vercel.json → vercel.json
├── frontend/.env.example → .env.example
└── frontend/README.md → README.md
```

## 🔄 Updated Deployment Scripts

### Backend Deployment Script

```bash
#!/bin/bash
# deploy-backend.sh
cd proclubs-stats-hub-backend
railway up
```

### Frontend Deployment Script

```bash
#!/bin/bash
# deploy-frontend.sh
cd proclubs-stats-hub-frontend
vercel --prod
```

## 🎯 Benefits After Split

1. **Faster Deployments** - Only deploy what changed
2. **Independent Versioning** - Different release cycles
3. **Team Collaboration** - Separate access controls
4. **CI/CD Optimization** - Smaller, faster builds
5. **Better Organization** - Clear separation of concerns

## 🚨 Important Notes

1. **Update Documentation** - Update all README files
2. **Environment Variables** - Keep them separate
3. **API URLs** - Update frontend to point to backend
4. **CORS Settings** - Update backend CORS origins
5. **Version Control** - Maintain separate version numbers

## 📋 Checklist

- [ ] Create backend repository
- [ ] Create frontend repository
- [ ] Move files to respective repositories
- [ ] Update package.json files
- [ ] Update documentation
- [ ] Test deployments
- [ ] Update environment variables
- [ ] Archive original monorepo
