# SAPL Integration Guide

This guide explains how to use the SAPL (South African Premier League) integration with the ProClubs Stats Hub, which connects to the LeagueRepublic API to import teams, fixtures, and results for Season 28.

## Overview

The SAPL integration provides a complete solution for importing data from the LeagueRepublic API into your local database. It includes:

- **Teams**: Import all teams from SAPL fixture groups
- **Fixtures**: Import all matches for Season 28
- **Results**: Import match results and scores
- **Standings**: Get current league standings
- **Statistics**: Team performance statistics

## API Endpoints

### Base URL

```
https://api.leaguerepublic.com/json
```

### League Information

- **League ID**: 10727087 (SAPL)
- **Season 28 ID**: 825650177

## Available Endpoints

### 1. Test Connection

```
GET /api/sapl/test-connection
```

Tests the connection to the SAPL LeagueRepublic API.

### 2. Get SAPL Teams

```
GET /api/sapl/teams
```

Fetches all teams from SAPL by retrieving teams from all fixture groups.

### 3. Sync SAPL Teams to Database

```
POST /api/sapl/sync-teams
```

Imports all SAPL teams into your local database.

### 4. Get SAPL Seasons

```
GET /api/sapl/seasons
```

Fetches all seasons for the SAPL league.

### 5. Get Season 28 Fixtures

```
GET /api/sapl/fixtures/season-28
```

Fetches all fixtures for Season 28.

### 6. Import Complete Season 28 Data

```
POST /api/sapl/import-season-28
```

**This is the main endpoint you'll use!** It imports everything for Season 28:

- Creates/updates the season
- Imports all teams
- Imports all fixtures and results

## Quick Start

1. **Start your backend server** - it will automatically register the SAPL routes
2. **Test the connection**: `GET /api/sapl/test-connection`
3. **Import Season 28 data**: `POST /api/sapl/import-season-28`
4. **Monitor the results** - you'll see detailed counts of created/updated records

## Frontend Integration

The frontend includes a comprehensive SAPL integration panel in the Competition Creation component with:

- Connection testing
- Team management
- One-click Season 28 import
- Real-time status tracking

## Troubleshooting

- **Server won't start**: Check that all middleware imports are correct
- **SAPL routes not found**: Ensure the SAPL routes file exists and is properly exported
- **Import errors**: Check the server logs for detailed error information

The integration is now fully restored and ready to use!
