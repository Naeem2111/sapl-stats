# Production Deployment Checklist

## Pre-Deployment Checklist

### Backend (Railway)

- [ ] **Environment Variables Set**

  - [ ] `DATABASE_URL` (Railway provides this)
  - [ ] `JWT_SECRET` (strong, random 32+ character string)
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (your Vercel frontend URL)
  - [ ] `PORT=3000` (Railway sets this automatically)

- [ ] **Database Setup**

  - [ ] PostgreSQL database created in Railway
  - [ ] Database migrations run (`npm run db:migrate:deploy`)
  - [ ] Test database connection

- [ ] **Security Configuration**
  - [ ] Strong JWT secret generated
  - [ ] CORS origins configured correctly
  - [ ] Rate limiting enabled
  - [ ] File upload limits set

### Frontend (Vercel)

- [ ] **Environment Variables Set**

  - [ ] `REACT_APP_API_URL` (your Railway backend URL)
  - [ ] `REACT_APP_ENVIRONMENT=production`
  - [ ] `REACT_APP_ENABLE_ANALYTICS=true`
  - [ ] `REACT_APP_ENABLE_DEBUG=false`

- [ ] **Build Configuration**
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `build`
  - [ ] Node.js version: 18.x

## Deployment Steps

### 1. Deploy Backend to Railway

```bash
cd backend
railway login
railway init
railway up
```

### 2. Set Backend Environment Variables

In Railway dashboard:

- Go to your project → Variables
- Add all required environment variables
- Save changes

### 3. Run Database Migrations

```bash
railway run npm run db:migrate:deploy
```

### 4. Deploy Frontend to Vercel

```bash
cd frontend
vercel login
vercel
```

### 5. Set Frontend Environment Variables

In Vercel dashboard:

- Go to your project → Settings → Environment Variables
- Add all required environment variables
- Redeploy if needed

## Post-Deployment Testing

### Backend Health Check

```bash
curl https://your-backend.railway.app/health
```

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"uptime": 123.456
}
```

### Frontend Access

- [ ] Visit your Vercel URL
- [ ] Check browser console for errors
- [ ] Test login functionality
- [ ] Test API calls

### API Endpoints Test

```bash
# Test authentication
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test stats endpoint
curl https://your-backend.railway.app/api/stats/leaderboard
```

## Security Verification

### CORS Configuration

- [ ] Frontend can make API calls
- [ ] No CORS errors in browser console
- [ ] Only allowed origins can access API

### Authentication

- [ ] JWT tokens are generated correctly
- [ ] Protected routes require authentication
- [ ] Tokens expire appropriately

### Rate Limiting

- [ ] API calls are rate limited
- [ ] Excessive requests are blocked
- [ ] Rate limit headers are present

## Performance Monitoring

### Backend Monitoring

- [ ] Railway metrics dashboard
- [ ] Database connection monitoring
- [ ] Memory and CPU usage
- [ ] Response time monitoring

### Frontend Monitoring

- [ ] Vercel analytics enabled
- [ ] Core Web Vitals monitoring
- [ ] Error tracking setup
- [ ] Performance metrics

## Backup and Recovery

### Database Backups

- [ ] Railway automatic backups enabled
- [ ] Manual backup strategy documented
- [ ] Recovery procedures tested

### Code Backups

- [ ] GitHub repository up to date
- [ ] All changes committed and pushed
- [ ] Deployment rollback plan ready

## Documentation

### Deployment Documentation

- [ ] `DEPLOYMENT_GUIDE.md` created
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Team access to deployment platforms

### API Documentation

- [ ] API endpoints documented
- [ ] Authentication flow documented
- [ ] Error codes documented
- [ ] Postman collection updated

## Go-Live Checklist

### Final Verification

- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] Security scan completed
- [ ] Backup systems working

### Team Notification

- [ ] Deployment completed notification
- [ ] Access credentials shared
- [ ] Monitoring alerts configured
- [ ] Support procedures documented

### Post-Launch Monitoring

- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Monitor performance
- [ ] User feedback collection

## Emergency Procedures

### Rollback Plan

- [ ] Previous version deployment ready
- [ ] Database rollback procedures
- [ ] Emergency contact list
- [ ] Incident response plan

### Support Contacts

- [ ] Railway support access
- [ ] Vercel support access
- [ ] Database admin contact
- [ ] Development team contacts

## Success Criteria

✅ **Deployment Successful When:**

- [ ] All health checks pass
- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Database operations successful
- [ ] No critical errors in logs
- [ ] Performance meets requirements

---

**Deployment Date:** ****\_\_\_****
**Deployed By:** ****\_\_\_****
**Version:** ****\_\_\_****
**Status:** ****\_\_\_****
