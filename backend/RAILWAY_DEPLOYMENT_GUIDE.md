# Railway Deployment Guide

## 🚀 Complete Backend Setup

### Step 1: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your `sapl-stats-backend` repository**
5. **Railway will automatically detect Node.js and deploy**

### Step 2: Add PostgreSQL Database

1. **In your Railway project, click "New"**
2. **Select "Database" → "PostgreSQL"**
3. **Wait for deployment (1-2 minutes)**

### Step 3: Configure Environment Variables

In your backend service, add these variables:

```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-32-characters-long
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Note:** `DATABASE_URL` is automatically provided by Railway.

### Step 4: Run Complete Setup

1. **Go to your backend service in Railway**
2. **Click "Deployments" tab**
3. **Click on the latest deployment**
4. **Click "View Logs"**
5. **Run this command in the terminal:**

```bash
npm run setup:full
```

This will:

- ✅ Run database migrations
- ✅ Create test users
- ✅ Create test teams
- ✅ Create test seasons
- ✅ Create test players
- ✅ Create test matches
- ✅ Create test statistics

### Step 5: Test Your Backend

Test these endpoints:

```bash
# Health check
curl https://your-backend.railway.app/health

# Login test
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sapl.com","password":"admin123"}'

# Get teams
curl https://your-backend.railway.app/api/teams

# Get stats
curl https://your-backend.railway.app/api/stats/leaderboard
```

### Step 6: Update Frontend

1. **Go to Vercel dashboard**
2. **Settings → Environment Variables**
3. **Add:**
   - `REACT_APP_API_URL` = `https://your-backend.railway.app`

## 🔑 Test Credentials

- **Admin:** `admin@sapl.com` / `admin123`
- **League Admin:** `league_admin@sapl.com` / `league123`
- **Team Admin:** `team_admin@sapl.com` / `team123`
- **Player:** `player1@sapl.com` / `player123`

## 📊 What Gets Created

- **4 Test Teams:** Real Madrid, Barcelona, Manchester United, Liverpool
- **5 Test Users:** Different roles and permissions
- **4 Test Players:** With realistic statistics
- **2 Test Matches:** Completed matches with scores
- **2 Test Seasons:** Current and previous season
- **Player Statistics:** Goals, assists, ratings, etc.

## 🎯 Next Steps

1. **Deploy backend to Railway**
2. **Run the setup script**
3. **Test the API endpoints**
4. **Update frontend with backend URL**
5. **Test the complete application**

Your backend will be fully functional with test data! 🚀
