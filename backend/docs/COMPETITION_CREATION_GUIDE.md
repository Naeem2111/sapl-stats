# Competition Creation & SAPL Integration Guide

This guide provides comprehensive documentation for the new competition creation system and SAPL integration features in the Pro Clubs Stats Hub.

## 🏆 Overview

The competition creation system allows administrators to:

- Create cup tournaments with various formats
- Integrate with SAPL to fetch and sync teams
- Manage tournament brackets and standings
- Track match results and statistics
- Handle different tournament formats (knockout, group stages, etc.)

## 🔗 SAPL Integration

### What is SAPL?

SAPL (Soccer Association Pro League) is an external system that provides team data and league information. Our system integrates with SAPL to:

- Fetch all available teams
- Sync team information automatically
- Maintain consistency between systems
- Import team logos and metadata

### SAPL API Endpoints

#### Test Connection

```http
GET /api/sapl/test-connection
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN

Tests the connection to the SAPL system and returns connection status.

#### Fetch SAPL Teams

```http
GET /api/sapl/teams
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

Retrieves all teams from the SAPL system without importing them.

#### Sync SAPL Teams

```http
POST /api/sapl/sync-teams
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN

Imports/updates teams from SAPL into the local system. Returns counts of created and updated teams.

### SAPL Configuration

Set these environment variables in your `.env` file:

```bash
SAPL_API_URL=https://api.sapl.com
SAPL_API_KEY=your_sapl_api_key_here
```

## 🏅 Cup Management

### Cup Formats

The system supports multiple tournament formats:

1. **KNOCKOUT** - Single elimination tournament
2. **DOUBLE_KNOCKOUT** - Double elimination tournament
3. **GROUP_KNOCKOUT** - Group stage followed by knockout rounds
4. **ROUND_ROBIN** - All teams play each other
5. **SWISS_SYSTEM** - Swiss tournament system

### Cup Statuses

- **PLANNING** - Cup is being planned
- **REGISTRATION** - Teams can register
- **SEEDING** - Teams are being seeded
- **ACTIVE** - Tournament is in progress
- **COMPLETED** - Tournament finished
- **CANCELLED** - Tournament cancelled

### Cup API Endpoints

#### Create Cup

```http
POST /api/cups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Champions Cup 2025",
  "description": "Annual championship tournament",
  "seasonId": "season_id_here",
  "format": "KNOCKOUT",
  "startDate": "2025-01-15",
  "endDate": "2025-02-15",
  "maxTeams": 16,
  "minTeams": 8
}
```

**Required Role:** COMPETITION_ADMIN

#### Get All Cups

```http
GET /api/cups?season=season_id&status=ACTIVE&format=KNOCKOUT
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

#### Get Cup Details

```http
GET /api/cups/:id
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

#### Update Cup

```http
PUT /api/cups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Cup Name",
  "status": "ACTIVE"
}
```

**Required Role:** COMPETITION_ADMIN

#### Delete Cup

```http
DELETE /api/cups/:id
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN

**Note:** Cups with matches or team entries cannot be deleted.

#### Add Team to Cup

```http
POST /api/cups/:id/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamId": "team_id_here",
  "seed": 1,
  "group": "A"
}
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

#### Remove Team from Cup

```http
DELETE /api/cups/:id/teams/:teamId
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

**Note:** Teams cannot be removed from cups that have already started.

#### Get Cup Standings

```http
GET /api/cups/:id/standings
Authorization: Bearer <token>
```

**Required Role:** COMPETITION_ADMIN, LEAGUE_ADMIN

Returns team standings with points, goals, and match statistics.

## 🎯 Frontend Components

### CompetitionCreation Component

Located at: `frontend/src/components/dashboard/CompetitionCreation.js`

**Features:**

- SAPL connection testing
- Team synchronization from SAPL
- Competition type selection (Cup vs Season)
- Tournament format configuration
- Team selection interface
- Date range validation

**Usage:**

1. Test SAPL connection
2. Sync teams from SAPL
3. Select competition type
4. Configure tournament settings
5. Choose participating teams
6. Set dates and constraints
7. Create competition

### CupManagement Component

Located at: `frontend/src/components/dashboard/CupManagement.js`

**Features:**

- View all cups with filtering
- Search and filter by season, status, format
- Cup progress tracking
- Team count and match statistics
- Action buttons for view, edit, delete
- Responsive table design

## 🗄️ Database Schema

### New Tables

#### `cups`

```sql
CREATE TABLE "cups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seasonId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxTeams" INTEGER,
    "minTeams" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cups_pkey" PRIMARY KEY ("id")
);
```

#### `cup_entries`

```sql
CREATE TABLE "cup_entries" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "seed" INTEGER,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cup_entries_pkey" PRIMARY KEY ("id")
);
```

#### `cup_rounds`

```sql
CREATE TABLE "cup_rounds" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cup_rounds_pkey" PRIMARY KEY ("id")
);
```

### Enhanced Tables

#### `teams`

Added fields:

- `saplId` - Unique SAPL team identifier
- `saplData` - JSON field for additional SAPL metadata

#### `matches`

Added fields:

- `cupId` - Reference to cup if match is part of tournament
- `cupRoundId` - Reference to specific cup round
- `matchNumber` - Match number within the round
- `isKnockout` - Boolean indicating knockout match
- `extraTime` - Extra time result
- `penalties` - Penalty shootout result

#### `player_match_stats` & `player_season_stats`

Added fields:

- `yellowCards` - Number of yellow cards
- `redCards` - Number of red cards

## 🚀 Getting Started

### 1. Environment Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your SAPL credentials

# Frontend
cd frontend
npm install
```

### 2. Database Migration

```bash
cd backend
npx prisma migrate dev --name add_sapl_and_cup_support
npx prisma generate
```

### 3. Start Services

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

### 4. Access Competition Creation

Navigate to `/competition-creation` in your frontend application.

## 🔧 Configuration

### SAPL API Settings

The SAPL service is configurable through environment variables:

```bash
# SAPL API Configuration
SAPL_API_URL=https://api.sapl.com
SAPL_API_KEY=your_api_key_here
SAPL_TIMEOUT=10000
```

### Tournament Settings

Default tournament constraints can be modified in the database schema:

```sql
-- Example: Modify default cup constraints
ALTER TABLE cups ALTER COLUMN maxTeams SET DEFAULT 32;
ALTER TABLE cups ALTER COLUMN minTeams SET DEFAULT 4;
```

## 📊 Statistics & Analytics

### Cup Statistics

Each cup provides comprehensive statistics:

- **Team Count** - Number of participating teams
- **Match Progress** - Percentage of completed matches
- **Status Tracking** - Current tournament phase
- **Format Information** - Tournament structure details

### Team Performance

Track team performance within cups:

- **Match Results** - Wins, draws, losses
- **Goal Statistics** - Goals for/against
- **Points Calculation** - 3 points for win, 1 for draw
- **Goal Difference** - Tiebreaker calculation

## 🔒 Security & Permissions

### Role-Based Access Control

- **COMPETITION_ADMIN** - Full access to all features
- **LEAGUE_ADMIN** - Can create and manage cups, view standings
- **TEAM_ADMIN** - Can view cup information and team stats
- **PLAYER** - Can view public cup information

### API Security

- All endpoints require JWT authentication
- Role-based authorization on all routes
- Input validation and sanitization
- SQL injection prevention through Prisma ORM

## 🐛 Troubleshooting

### Common Issues

#### SAPL Connection Failed

- Check API credentials in `.env`
- Verify network connectivity
- Ensure SAPL service is running
- Check API rate limits

#### Cup Creation Errors

- Validate all required fields
- Check date ranges for overlaps
- Ensure season exists
- Verify team availability

#### Database Migration Issues

- Ensure PostgreSQL is running
- Check database connection string
- Verify Prisma schema syntax
- Run `npx prisma generate` after schema changes

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=prisma:* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Bracket Generation**

   - Automatic seeding algorithms
   - Group stage management
   - Tiebreaker systems

2. **Real-time Updates**

   - WebSocket integration
   - Live match updates
   - Real-time standings

3. **Advanced Analytics**

   - Player performance tracking
   - Team statistics comparison
   - Historical data analysis

4. **Integration Features**
   - Multiple league systems
   - External tournament APIs
   - Social media integration

### API Extensions

Future API endpoints planned:

```http
POST /api/cups/:id/generate-bracket
POST /api/cups/:id/advance-round
GET /api/cups/:id/analytics
GET /api/cups/:id/history
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Support

For technical support or feature requests:

1. Check the troubleshooting section above
2. Review API documentation
3. Check system logs for errors
4. Contact the development team

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Author:** Pro Clubs Stats Hub Development Team

