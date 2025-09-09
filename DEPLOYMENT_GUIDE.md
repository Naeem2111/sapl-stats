# Production Deployment Guide

This guide covers deploying the ProClubs Stats Hub to Vercel (frontend) and Railway (backend).

## 🚀 Quick Deployment

### Prerequisites

- [Vercel account](https://vercel.com)
- [Railway account](https://railway.app)
- [GitHub repository](https://github.com) (recommended)

## 📱 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Production

```bash
cd frontend
npm run build
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Set environment variables
vercel env add REACT_APP_API_URL
# Enter your Railway backend URL when prompted
```

#### Option B: GitHub Integration

1. Connect your GitHub repository to Vercel
2. Select the `frontend` folder as the root directory
3. Set build command: `npm run build`
4. Set output directory: `build`

### 3. Environment Variables in Vercel

Set these in your Vercel dashboard:

| Variable                     | Value                              | Description        |
| ---------------------------- | ---------------------------------- | ------------------ |
| `REACT_APP_API_URL`          | `https://your-backend.railway.app` | Backend API URL    |
| `REACT_APP_ENVIRONMENT`      | `production`                       | Environment        |
| `REACT_APP_ENABLE_ANALYTICS` | `true`                             | Enable analytics   |
| `REACT_APP_ENABLE_DEBUG`     | `false`                            | Disable debug mode |

## 🔧 Backend Deployment (Railway)

### 1. Prepare Backend for Production

```bash
cd backend
npm install --production
```

### 2. Deploy to Railway

#### Option A: Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Option B: GitHub Integration

1. Connect your GitHub repository to Railway
2. Select the `backend` folder as the root directory
3. Railway will automatically detect Node.js and deploy

### 3. Database Setup

Railway will provide a PostgreSQL database. Set these environment variables:

| Variable       | Value                              | Description              |
| -------------- | ---------------------------------- | ------------------------ |
| `DATABASE_URL` | `postgresql://...`                 | Railway PostgreSQL URL   |
| `JWT_SECRET`   | `your-secret-key`                  | Strong JWT secret        |
| `NODE_ENV`     | `production`                       | Environment              |
| `CORS_ORIGIN`  | `https://your-frontend.vercel.app` | Frontend URL             |
| `PORT`         | `3000`                             | Port (Railway sets this) |

### 4. Run Database Migrations

After deployment, run migrations:

```bash
# Using Railway CLI
railway run npm run db:migrate:deploy

# Or connect to your Railway service and run:
npm run db:migrate:deploy
```

## 🔗 Connecting Frontend and Backend

### 1. Update CORS Settings

In your Railway backend environment variables, set:

```
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### 2. Update Frontend API URL

In your Vercel environment variables, set:

```
REACT_APP_API_URL=https://your-backend.railway.app
```

## 🛡️ Security Configuration

### Backend Security

- ✅ Helmet.js for security headers
- ✅ CORS configured for production
- ✅ Rate limiting enabled
- ✅ JWT authentication
- ✅ Input validation with Joi
- ✅ File upload limits

### Frontend Security

- ✅ HTTPS enforced
- ✅ Environment variables for sensitive data
- ✅ No sensitive data in client code

## 📊 Monitoring and Logs

### Railway Monitoring

- View logs: `railway logs`
- Monitor metrics in Railway dashboard
- Set up alerts for errors

### Vercel Monitoring

- View function logs in Vercel dashboard
- Monitor performance metrics
- Set up error tracking

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          cd backend
          railway up --detach

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel --prod
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure `CORS_ORIGIN` matches your frontend URL exactly
   - Check for trailing slashes

2. **Database Connection Issues**

   - Verify `DATABASE_URL` is correct
   - Run migrations: `npm run db:migrate:deploy`

3. **Build Failures**

   - Check Node.js version compatibility
   - Ensure all dependencies are installed

4. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test backend health
curl https://your-backend.railway.app/health

# Test frontend build locally
cd frontend && npm run build && npx serve -s build
```

## 📈 Performance Optimization

### Backend

- ✅ Compression middleware
- ✅ Rate limiting
- ✅ Database indexing
- ✅ Connection pooling

### Frontend

- ✅ Code splitting
- ✅ Image optimization
- ✅ Static asset caching
- ✅ Bundle size optimization

## 🔐 Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Performance monitoring active

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify environment variables
3. Test endpoints individually
4. Check Railway/Vercel status pages

## 🎉 Success!

Once deployed, your ProClubs Stats Hub will be available at:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.railway.app`
- **Health Check**: `https://your-backend.railway.app/health`
