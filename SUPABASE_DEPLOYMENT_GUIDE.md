# 🚀 Supabase Deployment Guide - ProClubs Stats Hub

This guide covers deploying your backend to Supabase using Edge Functions and PostgreSQL database.

## 🎯 **Why Supabase?**

- **Free Tier**: 500MB database, 2GB bandwidth, 50,000 monthly active users
- **Built-in Auth**: JWT authentication with Row Level Security (RLS)
- **Real-time**: WebSocket subscriptions for live updates
- **Edge Functions**: Serverless functions running globally
- **PostgreSQL**: Full SQL database with Prisma compatibility

## 📋 **Prerequisites**

- [Supabase Account](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed

## 🔧 **Step 1: Supabase Project Setup**

### **1.1 Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be ready (5-10 minutes)

### **1.2 Get Connection Details**

1. Go to Settings → Database
2. Copy the connection string
3. Note your project URL and API keys

### **1.3 Install Supabase CLI**

```bash
npm install -g supabase
supabase login
```

## 🗄️ **Step 2: Database Migration**

### **2.1 Initialize Supabase**

```bash
# In your project root
supabase init
```

### **2.2 Convert Prisma Schema to Supabase**

Your Prisma schema is already PostgreSQL-compatible! Create a migration file:

```bash
# Create migrations directory
mkdir -p supabase/migrations

# Create initial migration
cat > supabase/migrations/20250120000000_initial_schema.sql << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN', 'MODERATOR');
CREATE TYPE "CupFormat" AS ENUM ('KNOCKOUT', 'GROUP_STAGE', 'ROUND_ROBIN');
CREATE TYPE "CupStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED');
CREATE TYPE "CupEntryStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'WITHDRAWN');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BadgeType" AS ENUM ('GOAL_SCORER', 'ASSIST_LEADER', 'CLEAN_SHEET', 'MVP', 'CUSTOM');

-- Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create teams table
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "saplId" TEXT,
    "saplData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");
CREATE UNIQUE INDEX "teams_saplId_key" ON "teams"("saplId");

-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON "users"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own data" ON "users"
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Teams are viewable by all" ON "teams"
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify teams" ON "teams"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "users"
            WHERE "users"."id" = auth.uid()::text
            AND "users"."role" = 'ADMIN'
        )
    );
EOF
```

### **2.3 Push Migration to Supabase**

```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Reset database if needed
supabase db reset
```

## ⚡ **Step 3: Convert Express Routes to Edge Functions**

### **3.1 Create Functions Structure**

```bash
mkdir -p supabase/functions
cd supabase/functions
```

### **3.2 Example: Auth Function**

Create `supabase/functions/auth/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { email, password } = await req.json();

		// Create Supabase client
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? ""
		);

		// Authenticate user
		const { data, error } = await supabaseClient.auth.signInWithPassword({
			email,
			password,
		});

		if (error) throw error;

		return new Response(
			JSON.stringify({ user: data.user, session: data.session }),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			}
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 400,
		});
	}
});
```

### **3.3 Example: Teams Function**

Create `supabase/functions/teams/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_ANON_KEY") ?? ""
		);

		if (req.method === "GET") {
			// Get all teams
			const { data, error } = await supabaseClient
				.from("teams")
				.select("*")
				.order("name");

			if (error) throw error;

			return new Response(JSON.stringify(data), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			});
		}

		if (req.method === "POST") {
			// Create new team (admin only)
			const { name, logoUrl, saplId, saplData } = await req.json();

			const { data, error } = await supabaseClient
				.from("teams")
				.insert([{ name, logoUrl, saplId, saplData }])
				.select()
				.single();

			if (error) throw error;

			return new Response(JSON.stringify(data), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 201,
			});
		}

		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 405,
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 400,
		});
	}
});
```

## 🚀 **Step 4: Deploy Edge Functions**

### **4.1 Deploy All Functions**

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy auth
supabase functions deploy teams
```

### **4.2 Set Function Secrets**

```bash
# Set environment variables for functions
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="your-anon-key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 🔐 **Step 5: Update Frontend Configuration**

### **5.1 Install Supabase Client**

```bash
cd frontend
npm install @supabase/supabase-js
```

### **5.2 Update Environment Variables**

Create `frontend/.env`:

```bash
REACT_APP_SUPABASE_URL="https://your-project.supabase.co"
REACT_APP_SUPABASE_ANON_KEY="your-anon-key"
REACT_APP_API_URL="https://your-project.supabase.co/functions/v1"
```

### **5.3 Update API Calls**

Update your API calls to use Supabase functions:

```typescript
// Instead of axios calls to your Express backend
const response = await fetch(`${process.env.REACT_APP_API_URL}/teams`, {
	method: "GET",
	headers: {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	},
});
```

## 📊 **Step 6: Testing & Verification**

### **6.1 Test Functions Locally**

```bash
# Start local development
supabase start

# Test functions
curl -X POST http://localhost:54321/functions/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### **6.2 Check Function Logs**

```bash
# View function logs
supabase functions logs

# View specific function logs
supabase functions logs auth
```

## 🔍 **Troubleshooting Supabase**

### **Common Issues**

1. **Function Not Found (404)**

   - Check function name and path
   - Verify function is deployed
   - Check function URL format

2. **Database Connection Errors**

   - Verify connection string format
   - Check RLS policies
   - Ensure proper permissions

3. **CORS Errors**
   - Verify CORS headers in functions
   - Check frontend origin
   - Test with Postman/curl

### **Useful Commands**

```bash
# Check project status
supabase status

# View project info
supabase projects list

# Reset local development
supabase stop
supabase start

# View database
supabase db diff
```

## 💰 **Cost Breakdown**

- **Supabase Free Tier**: $0/month

  - 500MB database
  - 2GB bandwidth
  - 50,000 monthly active users
  - 500MB file storage

- **Vercel Free Tier**: $0/month

  - 100GB bandwidth/month
  - Automatic deployments

- **Total**: $0/month for development/small production

## 🎯 **Next Steps**

1. **Deploy your database schema**
2. **Convert Express routes to Edge Functions**
3. **Test functions locally**
4. **Deploy to production**
5. **Update frontend to use Supabase functions**

## 🆘 **Need Help?**

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Guide](https://supabase.com/docs/guides/database)
- [Auth Guide](https://supabase.com/docs/guides/auth)
