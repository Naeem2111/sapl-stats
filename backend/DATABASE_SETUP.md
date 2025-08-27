# Database Setup Guide

## Option 1: Local PostgreSQL Installation (Recommended for Development)

### Step 1: Install PostgreSQL

- **Windows**: Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### Step 2: Start PostgreSQL Service

- **Windows**: PostgreSQL service should start automatically after installation
- **macOS**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`

### Step 3: Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE proclubs_stats;

# Create user (optional, you can use postgres user for development)
CREATE USER proclubs_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE proclubs_stats TO proclubs_user;

# Exit psql
\q
```

### Step 4: Update .env File

Create a `.env` file in your project root:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/proclubs_stats"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Option 2: Cloud Database (Neon, Supabase, etc.)

### Using Neon (Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string
4. Update your `.env` file with the connection string

### Using Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update your `.env` file

## Option 3: Docker (Quick Setup)

### Install Docker Desktop

1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Install and start Docker

### Run PostgreSQL Container

```bash
docker run --name proclubs-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=proclubs_stats \
  -p 5432:5432 \
  -d postgres:15
```

### Update .env File

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/proclubs_stats"
# ... other variables
```

## After Database Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Generate Prisma Client

```bash
npm run db:generate
```

### Step 3: Run Database Migrations

```bash
npm run db:migrate
```

### Step 4: Seed Database (Optional)

```bash
npm run db:seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

## Troubleshooting

### Common Issues:

1. **Port 5432 already in use**

   - Check if PostgreSQL is already running: `netstat -an | grep 5432`
   - Stop existing service or change port in connection string

2. **Authentication failed**

   - Check username/password in connection string
   - Verify user has access to database

3. **Connection refused**
   - Ensure PostgreSQL service is running
   - Check firewall settings
   - Verify host and port in connection string

### Test Connection

```bash
# Test if PostgreSQL is running
psql -h localhost -U postgres -d proclubs_stats
```

## Next Steps

Once your database is connected and migrations are successful:

1. Your API will be available at `http://localhost:3000`
2. Test the health endpoint: `GET http://localhost:3000/health`
3. Use the seed data to test authentication and other endpoints
4. Start building your frontend or testing with tools like Postman
