# 🚀 LeagueRepublic Import Guide

This guide explains how to import teams, fixtures, and all data from the LeagueRepublic API into your ProClubs Stats Hub database.

## 🎯 What This Import Does

The import system will automatically:

1. **Season Selection** - Choose which season to import (28, 27, or 26)
2. **Create/Update Season** - Sets up the selected season in your database
3. **Import All Teams** - From all 7 divisions/leagues
4. **Import All Fixtures** - Complete match schedule with results for the selected season
5. **Handle Updates** - Smartly updates existing data without duplicates
6. **Rate Limiting** - Respects API limits to avoid being blocked

## 📊 Leagues Covered

| League Name                 | Fixture Group ID | Description                      |
| --------------------------- | ---------------- | -------------------------------- |
| **SL Prem**                 | 864938965        | Super League Premiership         |
| **SL Champs**               | 826927856        | Super League Championship        |
| **Super League 1 West**     | 436052018        | Super League 1 West Division     |
| **Super League 1 East**     | 258156888        | Super League 1 East Division     |
| **Super League Conference** | 729386372        | Super League Conference Division |
| **Premiership**             | 966984927        | Premiership Division             |
| **Championship**            | 677552147        | Championship Division            |

## 🚀 Quick Start

### **1. Prerequisites**

- Backend server running
- Database connected and migrated
- Prisma client generated

### **2. Run the Import**

#### **Interactive Mode (Recommended)**

```bash
cd backend
npm run import:leaguerepublic
```

This will prompt you to select which season to import.

#### **Direct Season Import**

```bash
# Import specific seasons
npm run import:season28    # Import Season 28
npm run import:season27    # Import Season 27
npm run import:season26    # Import Season 26

# Or use command line arguments
npm run import:leaguerepublic -- --season=28
npm run import:leaguerepublic -- --season=27
npm run import:leaguerepublic -- --season=26
```

### **3. Monitor Progress**

The script will show real-time progress:

- Teams being fetched from each league
- Fixtures being imported
- Database operations
- Final summary with counts

## 📋 What Gets Imported

### **Teams**

- Team names and IDs
- League assignments
- Current standings data
- SAPL integration data

### **Fixtures**

- Complete match schedule
- Home/away teams
- Match dates and times
- Current scores and status
- League assignments

### **Season**

- Selected season configuration (28, 27, or 26)
- Start/end dates for the chosen season
- Description and metadata

## 🎯 Season Selection

### **Available Seasons**

| Season | Year | Description       | Status        |
| ------ | ---- | ----------------- | ------------- |
| **28** | 2024 | Current season    | ✅ Active     |
| **27** | 2023 | Previous season   | 📚 Historical |
| **26** | 2022 | Historical season | 📚 Historical |

### **How to Select Seasons**

1. **Interactive Mode**: Run `npm run import:leaguerepublic` and choose from the prompt
2. **Direct Import**: Use `npm run import:season28` for specific seasons
3. **Command Line**: Use `npm run import:leaguerepublic -- --season=28`

### **Season-Specific Data**

Each season contains:

- Complete fixture schedule for that period
- Team standings and performance data
- Match results and statistics
- League structure and divisions

## 🔄 Update Process

The import is **idempotent** - you can run it multiple times safely:

- **New teams** → Created
- **Existing teams** → Updated with latest data
- **New fixtures** → Created
- **Existing fixtures** → Updated with latest scores/status
- **No duplicates** → Smart matching prevents duplicates

## 📊 Expected Results

After a successful import, you should see:

```
📊 IMPORT SUMMARY
============================================================
🏆 Season: Season 28
📅 Season ID: [generated-id]

👥 TEAMS:
  ✅ Created: [X]
  🔄 Updated: [Y]
  ❌ Errors: 0
  📊 Total: [X+Y]

⚽ FIXTURES:
  ✅ Created: [A]
  🔄 Updated: [B]
  ❌ Errors: 0
  📊 Total: [A+B]

🎯 LEAGUES COVERED:
  • SL Prem
  • SL Champs
  • Super League 1 West
  • Super League 1 East
  • Super League Conference
  • Premiership
  • Championship
```

## 🛠️ Manual Import (Advanced)

If you need to run the import programmatically:

```javascript
const {
	importFromLeagueRepublic,
	AVAILABLE_SEASONS,
} = require("./scripts/import-from-leaguerepublic");

// Run the import with interactive season selection
await importFromLeagueRepublic();

// Run the import for a specific season
await importFromLeagueRepublic(AVAILABLE_SEASONS["28"]);
```

## 📋 NPM Scripts

The following npm scripts are available for easy season imports:

```bash
# Interactive season selection
npm run import:leaguerepublic

# Direct season imports
npm run import:season28    # Season 28 (2024)
npm run import:season27    # Season 27 (2023)
npm run import:season26    # Season 26 (2022)

# Command line arguments
npm run import:leaguerepublic -- --season=28
npm run import:leaguerepublic -- --help
```

## 🔧 Configuration

### **API Settings**

The import uses these default settings:

- **Base URL**: `https://api.leaguerepublic.com/json`
- **Timeout**: 15 seconds per request
- **Rate Limit**: 1 second between requests
- **Retries**: Built-in error handling

### **Customizing Leagues**

To modify which leagues are imported, edit `LEAGUE_MAPPINGS` in the script:

```javascript
const LEAGUE_MAPPINGS = {
	"Your League": {
		name: "Your League",
		fixtureGroupId: "YOUR_FIXTURE_GROUP_ID",
		description: "Your League Description",
	},
	// ... add more leagues
};
```

### **Season Configuration**

To change the season settings, modify `SEASON_CONFIG`:

```javascript
const SEASON_CONFIG = {
	name: "Your Season Name",
	startDate: new Date("2024-01-01"),
	endDate: new Date("2024-12-31"),
	description: "Your season description",
};
```

## 🔍 Troubleshooting

### **Common Issues**

1. **"API call failed"**

   - Check internet connection
   - Verify LeagueRepublic API is accessible
   - Check if you're being rate limited

2. **"Teams not found"**

   - Some fixtures may reference teams not yet imported
   - The script will skip these and continue
   - Check the logs for specific team names

3. **"Database connection failed"**
   - Ensure your database is running
   - Check Prisma connection settings
   - Verify database schema is up to date

### **Debug Mode**

For detailed logging, you can modify the script to add more console.log statements or run with Node.js debug flags:

```bash
DEBUG=* npm run import:leaguerepublic
```

## 📈 Performance

### **Expected Duration**

- **Small leagues** (10-20 teams): 2-5 minutes
- **Medium leagues** (20-50 teams): 5-15 minutes
- **Large leagues** (50+ teams): 15-30 minutes

### **Rate Limiting**

The script respects API limits:

- 1 second delay between requests
- Automatic retry on failures
- Graceful error handling

## 🔄 Regular Updates

### **Recommended Schedule**

- **Daily**: For active seasons with live matches
- **Weekly**: For regular season updates
- **Monthly**: For historical data maintenance

### **Automation**

You can set up automated imports using cron jobs or CI/CD pipelines:

```bash
# Daily at 6 AM
0 6 * * * cd /path/to/backend && npm run import:leaguerepublic

# Every 6 hours during match days
0 */6 * * 6-7 cd /path/to/backend && npm run import:leaguerepublic
```

## 📚 API Reference

### **LeagueRepublic Endpoints Used**

- `getStandingsForFixtureGroup/1/{id}.json` - Get teams and standings
- `getFixturesForFixtureGroup/1/{id}.json` - Get fixtures for a league

### **Data Structure**

The import handles these data transformations:

- **Team IDs** → `saplId` field
- **Fixture Status** → Match status enum
- **League Names** → Stored in team metadata
- **Standings Data** → Stored in `saplData` JSON field

## 🎯 Next Steps

After successful import:

1. **Verify Data** - Check your database for imported teams and fixtures
2. **Test Frontend** - Ensure the data displays correctly
3. **Set Up Monitoring** - Monitor for any import errors
4. **Schedule Updates** - Set up regular import schedules

## 🆘 Need Help?

- Check the console output for detailed error messages
- Verify your database connection and schema
- Ensure you have the latest version of the script
- Check LeagueRepublic API status if all requests fail

## 📝 Changelog

- **v1.0.0** - Initial import script with all 7 leagues
- **v1.1.0** - Added rate limiting and error handling
- **v1.2.0** - Added standings data import
- **v1.3.0** - Improved duplicate detection and updates
