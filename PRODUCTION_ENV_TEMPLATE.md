# Production Environment Variables Template

## Backend Environment Variables (Railway)

Copy these to your Railway project environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# SAPL Integration (if using)
SAPL_API_KEY=your-sapl-api-key
SAPL_BASE_URL=https://api.sapl.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
```

## Frontend Environment Variables (Vercel)

Set these in your Vercel project environment variables:

```env
# API Configuration
REACT_APP_API_URL=https://your-backend.railway.app

# Environment
REACT_APP_ENVIRONMENT=production

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false

# App Configuration
REACT_APP_APP_NAME=ProClubs Stats Hub
REACT_APP_VERSION=1.0.0
```

## Important Notes

1. **JWT_SECRET**: Generate a strong, random secret key (at least 32 characters)
2. **DATABASE_URL**: Railway will provide this automatically
3. **CORS_ORIGIN**: Must match your exact frontend URL
4. **REACT_APP_API_URL**: Must match your exact backend URL

## Security Recommendations

- Use strong, unique passwords
- Generate random JWT secrets
- Enable HTTPS only
- Set up proper CORS origins
- Use environment-specific configurations
