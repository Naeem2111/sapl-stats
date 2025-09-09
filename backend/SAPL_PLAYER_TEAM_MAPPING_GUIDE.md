# SAPL Player Team Mapping Guide

This guide explains how to properly map players from the SAPL CSV data to their teams using the Person ID system.

## Overview

The SAPL system uses Person IDs (like `486610799`) to identify players, which can be accessed via URLs like:
`http://sapl.co.za/player/486610799.html`

Our system needs to:

1. Import players from the CSV file (`PERSON_1166.csv`)
2. Create teams based on team names in the CSV
3. Map players to their correct teams using the Person ID

## Scripts Available

### 1. `importSAPLPlayersWithTeams.js`

**Complete import script** - Use this for a full import from scratch.

```bash
cd backend
node src/database/importSAPLPlayersWithTeams.js
```

This script:

- Reads the `PERSON_1166.csv` file
- Creates users for each player
- Creates teams from team names in the CSV
- Maps players to their teams
- Sets default password: `SAPL2024!`

### 2. `mapPlayersToTeams.js`

**Mapping only script** - Use this if players are already imported but not mapped to teams.

```bash
cd backend
node src/database/mapPlayersToTeams.js
```

This script:

- Reads the CSV file
- Creates missing teams
- Maps existing players to teams based on Person ID

### 3. `testPlayerTeamMapping.js`

**Test script** - Use this to test the mapping with sample data.

```bash
cd backend
node src/database/testPlayerTeamMapping.js
```

### 4. `verifySAPLMapping.js`

**Verification script** - Use this to verify the mapping results.

```bash
cd backend
node src/database/verifySAPLMapping.js
```

## CSV Data Structure

The `PERSON_1166.csv` file contains:

- **Person ID**: Unique identifier (e.g., `783008956`)
- **Role**: Should be "Player"
- **Teams**: Team name(s), can be comma-separated for multiple teams
- **First Name**, **Last Name**: Player names
- **User Name**: Gamertag/username
- **Email Addr**: Email address
- **Active From/To**: Date ranges
- **Status**: Usually "Active"

Example row:

```
783008956,Player,Mythe Et Caviar,16/12/24,,,Aaron,Neto,,,,258843882817,Active,,,,,,,,,,Mad_N_Gamer,,
```

## Database Schema

The system uses these key relationships:

### User Model

- `saplId`: Stores the Person ID from SAPL
- `username`: Player's gamertag
- `email`: Player's email

### Player Model

- `saplId`: Links to SAPL Person ID
- `teamId`: Links to Team table
- `teams`: Raw team data from CSV
- `userId`: Links to User table

### Team Model

- `name`: Team name
- `saplId`: SAPL team ID (if available)

## Usage Instructions

### Option 1: Full Import (Recommended for new setup)

1. Ensure the `PERSON_1166.csv` file is in the project root
2. Run the complete import:
   ```bash
   cd backend
   node src/database/importSAPLPlayersWithTeams.js
   ```

### Option 2: Map Existing Players

If you already have players imported but they're not mapped to teams:

1. Run the mapping script:
   ```bash
   cd backend
   node src/database/mapPlayersToTeams.js
   ```

### Verification

After running either script, verify the results:

```bash
cd backend
node src/database/verifySAPLMapping.js
```

This will show:

- All players mapped to teams
- SAPL URLs for verification
- Team statistics
- Players without teams (if any)

## SAPL URL Verification

Each player can be verified using their Person ID:

- Player with Person ID `783008956` → `http://sapl.co.za/player/783008956.html`
- Player with Person ID `486610799` → `http://sapl.co.za/player/486610799.html`

## Handling Multiple Teams

Some players have multiple teams in the CSV (comma-separated):

```
"Avendale Athlone, Brotherhood FC, PICHICHI FC"
```

The system:

1. Creates all teams mentioned
2. Maps the player to the **first team** as their primary team
3. Stores the full team list in the `teams` field

## Default Credentials

For imported players, the default password is: `SAPL2024!`

Players can change this after logging in.

## Troubleshooting

### Common Issues

1. **CSV file not found**

   - Ensure `PERSON_1166.csv` is in the project root directory

2. **Players not mapping to teams**

   - Check that team names in CSV match exactly
   - Run verification script to see unmapped players

3. **Duplicate users**
   - The script skips users that already exist (based on saplId)
   - Check logs for "already exists" messages

### Logs

All scripts provide detailed logging:

- ✅ Success operations
- ⚠️ Warnings (skipped items)
- ❌ Errors
- 📊 Progress updates

## Next Steps

After successful mapping:

1. **Verify the mapping** using the verification script
2. **Test login** with some players using default password
3. **Update player positions** if needed
4. **Set up leagues** and link teams to leagues
5. **Import match data** from SAPL

## API Endpoints

Once mapped, you can use these endpoints:

- `GET /api/players` - List all players with team info
- `GET /api/players/:id` - Get specific player with team details
- `GET /api/teams` - List all teams with player counts
- `GET /api/teams/:id` - Get team with players

The player data will include:

- Team information
- SAPL Person ID
- SAPL profile URL
- All imported CSV data
