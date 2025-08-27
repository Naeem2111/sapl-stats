# FC 26 Pro Clubs Stats Hub - API Testing Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Endpoints](#1-authentication-endpoints)
3. [Teams Endpoints](#2-teams-endpoints)
4. [Players Endpoints](#3-players-endpoints)
5. [Matches Endpoints](#4-matches-endpoints)
6. [Stats Endpoints](#5-stats-endpoints)
7. [Seasons Endpoints](#6-seasons-endpoints)
8. [Users Endpoints](#7-users-endpoints)
9. [Testing Checklist](#testing-checklist)
10. [Quick Test Commands](#quick-test-commands)

---

## Prerequisites

### Required Setup

- ✅ Database running (PostgreSQL Docker container)
- ✅ Server started (`npm run dev`)
- ✅ Test tools: Postman, Insomnia, or curl commands
- ✅ JWT tokens from authentication endpoints

### Environment Variables

Ensure your `.env` file contains:

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/proclubs_stats"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

### Role Hierarchy

The system uses a hierarchical role system:

- **COMPETITION_ADMIN**: Highest level - can issue bans, create competitions, manual adjustments
- **LEAGUE_ADMIN**: Can manage all teams + team admin powers
- **TEAM_ADMIN**: Captain/vice captain - can capture stats, request player changes
- **PLAYER**: Basic user - can view stats and update profile

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 User Registration

**Endpoint**: `POST /api/auth/register`  
**Purpose**: Create new user account and player profile  
**Required Fields**: `username`, `email`, `password`, `gamertag`  
**Optional Fields**: `realName`, `position`

#### Test Cases

| Test Scenario                      | Expected Result                 | Status |
| ---------------------------------- | ------------------------------- | ------ |
| Valid registration with all fields | 201 Created + JWT token         | ⬜     |
| Registration with minimal fields   | 201 Created + JWT token         | ⬜     |
| Duplicate username/email           | 400 Bad Request + error message | ⬜     |
| Duplicate gamertag                 | 400 Bad Request + error message | ⬜     |
| Invalid position values            | 400 Bad Request + error message | ⬜     |
| Password too short (<6 chars)      | 400 Bad Request + error message | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testplayer1",
  "email": "player1@test.com",
  "password": "password123",
  "gamertag": "TestPlayer1",
  "realName": "John Doe",
  "position": "ST"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "User registered successfully",
	"data": {
		"user": {
			"id": "user_id",
			"username": "testplayer1",
			"email": "player1@test.com",
			"role": "PLAYER"
		},
		"player": {
			"id": "player_id",
			"gamertag": "TestPlayer1",
			"position": "ST"
		},
		"token": "jwt_token_here"
	}
}
```

---

### 1.2 User Login

**Endpoint**: `POST /api/auth/login`  
**Purpose**: Authenticate user and get JWT token  
**Required Fields**: `email`, `password`

#### Test Cases

| Test Scenario           | Expected Result                  | Status |
| ----------------------- | -------------------------------- | ------ |
| Valid login credentials | 200 OK + JWT token               | ⬜     |
| Invalid email           | 401 Unauthorized + error message | ⬜     |
| Invalid password        | 401 Unauthorized + error message | ⬜     |
| Non-existent user       | 401 Unauthorized + error message | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "player1@test.com",
  "password": "password123"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Login successful",
	"data": {
		"user": {
			"id": "user_id",
			"username": "testplayer1",
			"email": "player1@test.com",
			"role": "PLAYER"
		},
		"players": [
			{
				"id": "player_id",
				"gamertag": "TestPlayer1",
				"position": "ST",
				"teamId": null
			}
		],
		"token": "jwt_token_here"
	}
}
```

---

### 1.3 Get User Profile

**Endpoint**: `GET /api/auth/profile`  
**Purpose**: Get current user's profile and player info  
**Authentication**: Required (Bearer token)

#### Test Cases

| Test Scenario      | Expected Result       | Status |
| ------------------ | --------------------- | ------ |
| With valid token   | 200 OK + user profile | ⬜     |
| Without token      | 401 Unauthorized      | ⬜     |
| With expired token | 401 Unauthorized      | ⬜     |
| With invalid token | 401 Unauthorized      | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "user_id",
			"username": "testplayer1",
			"email": "player1@test.com",
			"role": "PLAYER",
			"createdAt": "2024-01-01T00:00:00Z"
		},
		"players": [
			{
				"id": "player_id",
				"gamertag": "TestPlayer1",
				"position": "ST",
				"team": {
					"id": "team_id",
					"name": "Team Name",
					"logoUrl": "logo_url"
				}
			}
		]
	}
}
```

---

### 1.4 Change Password

**Endpoint**: `PUT /api/auth/change-password`  
**Purpose**: Update user's password  
**Authentication**: Required (Bearer token)  
**Required Fields**: `currentPassword`, `newPassword`

#### Test Cases

| Test Scenario            | Expected Result          | Status |
| ------------------------ | ------------------------ | ------ |
| Valid current password   | 200 OK + success message | ⬜     |
| Invalid current password | 401 Unauthorized         | ⬜     |
| New password too short   | 400 Bad Request          | ⬜     |
| Without authentication   | 401 Unauthorized         | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/auth/change-password
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Password changed successfully"
}
```

---

## 2. Teams Endpoints (`/api/teams`)

### 2.1 List All Teams

**Endpoint**: `GET /api/teams`  
**Purpose**: Get all teams with basic info  
**Authentication**: None required

#### Test Cases

| Test Scenario                      | Expected Result            | Status |
| ---------------------------------- | -------------------------- | ------ |
| Returns empty array if no teams    | 200 OK + empty array       | ⬜     |
| Returns teams if they exist        | 200 OK + teams array       | ⬜     |
| Proper pagination (if implemented) | 200 OK + paginated results | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/teams
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"id": "team_id",
			"name": "Team Name",
			"logoUrl": "logo_url",
			"createdAt": "2024-01-01T00:00:00Z",
			"_count": {
				"players": 0
			}
		}
	]
}
```

---

### 2.2 Get Team by ID

**Endpoint**: `GET /api/teams/:id`  
**Purpose**: Get detailed team information  
**Authentication**: None required

#### Test Cases

| Test Scenario        | Expected Result               | Status |
| -------------------- | ----------------------------- | ------ |
| Valid team ID        | 200 OK + team details         | ⬜     |
| Invalid team ID      | 404 Not Found                 | ⬜     |
| Team with players    | 200 OK + team + players       | ⬜     |
| Team without players | 200 OK + team + empty players | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/teams/TEAM_ID_HERE
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"id": "team_id",
		"name": "Team Name",
		"logoUrl": "logo_url",
		"createdAt": "2024-01-01T00:00:00Z",
		"players": [
			{
				"id": "player_id",
				"gamertag": "Player1",
				"position": "ST",
				"realName": "John Doe"
			}
		]
	}
}
```

---

### 2.3 Create Team

**Endpoint**: `POST /api/teams`  
**Purpose**: Create new team  
**Authentication**: Required (Manager/Admin role)  
**Required Fields**: `name`

#### Test Cases

| Test Scenario           | Expected Result            | Status |
| ----------------------- | -------------------------- | ------ |
| With team admin token   | 201 Created + team details | ⬜     |
| With league admin token | 201 Created + team details | ⬜     |
| With competition admin  | 201 Created + team details | ⬜     |
| With player token       | 403 Forbidden              | ⬜     |
| Without token           | 401 Unauthorized           | ⬜     |
| Missing team name       | 400 Bad Request            | ⬜     |
| Duplicate team name     | 400 Bad Request            | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/teams
Authorization: Bearer TEAM_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "New Team Name",
  "logoUrl": "https://example.com/logo.png"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Team created successfully",
	"data": {
		"id": "new_team_id",
		"name": "New Team Name",
		"logoUrl": "https://example.com/logo.png",
		"createdAt": "2024-01-01T00:00:00Z"
	}
}
```

---

### 2.4 Update Team

**Endpoint**: `PUT /api/teams/:id`  
**Purpose**: Update team information  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario                      | Expected Result       | Status |
| ---------------------------------- | --------------------- | ------ |
| Valid updates with manager token   | 200 OK + updated team | ⬜     |
| Unauthorized access (player token) | 403 Forbidden         | ⬜     |
| Non-existent team                  | 404 Not Found         | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/teams/TEAM_ID
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "name": "Updated Team Name",
  "logoUrl": "https://example.com/new-logo.png"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Team updated successfully",
	"data": {
		"id": "team_id",
		"name": "Updated Team Name",
		"logoUrl": "https://example.com/new-logo.png",
		"updatedAt": "2024-01-01T00:00:00Z"
	}
}
```

---

### 2.5 Delete Team

**Endpoint**: `DELETE /api/teams/:id`  
**Purpose**: Remove team  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario             | Expected Result          | Status |
| ------------------------- | ------------------------ | ------ |
| Delete with manager token | 200 OK + success message | ⬜     |
| Delete with player token  | 403 Forbidden            | ⬜     |
| Delete non-existent team  | 404 Not Found            | ⬜     |

#### Sample Request

```
DELETE http://localhost:3000/api/teams/TEAM_ID
Authorization: Bearer MANAGER_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"message": "Team deleted successfully"
}
```

---

## 3. Players Endpoints (`/api/players`)

### 3.1 List All Players

**Endpoint**: `GET /api/players`  
**Purpose**: Get all players with basic info  
**Query Parameters**: `position`, `teamId`, `limit`, `offset`

#### Test Cases

| Test Scenario      | Expected Result            | Status |
| ------------------ | -------------------------- | ------ |
| All players        | 200 OK + players array     | ⬜     |
| Filter by position | 200 OK + filtered players  | ⬜     |
| Filter by team     | 200 OK + team players      | ⬜     |
| Pagination         | 200 OK + paginated results | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/players?position=ST&limit=10
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"id": "player_id",
			"gamertag": "Player1",
			"position": "ST",
			"realName": "John Doe",
			"team": {
				"id": "team_id",
				"name": "Team Name"
			}
		}
	]
}
```

---

### 3.2 Get Player by ID

**Endpoint**: `GET /api/players/:id`  
**Purpose**: Get detailed player information  
**Authentication**: None required

#### Test Cases

| Test Scenario       | Expected Result             | Status |
| ------------------- | --------------------------- | ------ |
| Valid player ID     | 200 OK + player details     | ⬜     |
| Invalid player ID   | 404 Not Found               | ⬜     |
| Player with team    | 200 OK + player + team      | ⬜     |
| Player without team | 200 OK + player + null team | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/players/PLAYER_ID
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"id": "player_id",
		"gamertag": "Player1",
		"position": "ST",
		"realName": "John Doe",
		"team": {
			"id": "team_id",
			"name": "Team Name",
			"logoUrl": "logo_url"
		},
		"stats": {
			"totalGoals": 15,
			"totalAssists": 8,
			"averageRating": 7.8
		}
	}
}
```

---

### 3.3 Update Player

**Endpoint**: `PUT /api/players/:id`  
**Purpose**: Update player profile  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario           | Expected Result         | Status |
| ----------------------- | ----------------------- | ------ |
| Valid updates           | 200 OK + updated player | ⬜     |
| Unauthorized access     | 403 Forbidden           | ⬜     |
| Invalid position values | 400 Bad Request         | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/players/PLAYER_ID
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "position": "CM",
  "realName": "Updated Name"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Player updated successfully",
	"data": {
		"id": "player_id",
		"gamertag": "Player1",
		"position": "CM",
		"realName": "Updated Name"
	}
}
```

---

### 3.4 Assign Player to Team

**Endpoint**: `POST /api/players/:id/assign-team`  
**Purpose**: Assign player to a team  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario               | Expected Result          | Status |
| --------------------------- | ------------------------ | ------ |
| Valid team assignment       | 200 OK + success message | ⬜     |
| Assign to non-existent team | 400 Bad Request          | ⬜     |
| Unauthorized access         | 403 Forbidden            | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/players/PLAYER_ID/assign-team
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "teamId": "TEAM_ID"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Player assigned to team successfully"
}
```

---

## 4. Matches Endpoints (`/api/matches`)

### 4.1 List All Matches

**Endpoint**: `GET /api/matches`  
**Purpose**: Get all matches  
**Query Parameters**: `seasonId`, `teamId`, `status`

#### Test Cases

| Test Scenario    | Expected Result         | Status |
| ---------------- | ----------------------- | ------ |
| All matches      | 200 OK + matches array  | ⬜     |
| Filter by season | 200 OK + season matches | ⬜     |
| Filter by team   | 200 OK + team matches   | ⬜     |
| Filter by status | 200 OK + status matches | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/matches?seasonId=SEASON_ID&status=COMPLETED
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"id": "match_id",
			"homeTeam": {
				"id": "home_team_id",
				"name": "Home Team"
			},
			"awayTeam": {
				"id": "away_team_id",
				"name": "Away Team"
			},
			"homeScore": 2,
			"awayScore": 1,
			"status": "COMPLETED",
			"scheduledDate": "2024-01-15T20:00:00Z"
		}
	]
}
```

---

### 4.2 Create Match

**Endpoint**: `POST /api/matches`  
**Purpose**: Create new match  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario              | Expected Result             | Status |
| -------------------------- | --------------------------- | ------ |
| Valid match creation       | 201 Created + match details | ⬜     |
| Same team as home and away | 400 Bad Request             | ⬜     |
| Missing required fields    | 400 Bad Request             | ⬜     |
| Unauthorized access        | 401 Unauthorized            | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/matches
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "homeTeamId": "HOME_TEAM_ID",
  "awayTeamId": "AWAY_TEAM_ID",
  "seasonId": "SEASON_ID",
  "competitionType": "LEAGUE",
  "scheduledDate": "2024-01-15T20:00:00Z"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Match created successfully",
	"data": {
		"id": "match_id",
		"homeTeamId": "HOME_TEAM_ID",
		"awayTeamId": "AWAY_TEAM_ID",
		"seasonId": "SEASON_ID",
		"competitionType": "LEAGUE",
		"scheduledDate": "2024-01-15T20:00:00Z",
		"status": "SCHEDULED"
	}
}
```

---

### 4.3 Update Match

**Endpoint**: `PUT /api/matches/:id`  
**Purpose**: Update match details  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario        | Expected Result         | Status |
| -------------------- | ----------------------- | ------ |
| Valid updates        | 200 OK + updated match  | ⬜     |
| Invalid score values | 400 Bad Request         | ⬜     |
| Status transitions   | 200 OK + status updated | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/matches/MATCH_ID
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "homeScore": 2,
  "awayScore": 1,
  "status": "COMPLETED"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Match updated successfully",
	"data": {
		"id": "match_id",
		"homeScore": 2,
		"awayScore": 1,
		"status": "COMPLETED"
	}
}
```

---

### 4.4 Add Player Match Stats

**Endpoint**: `POST /api/matches/:id/player-stats`  
**Purpose**: Add player statistics for a match  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario               | Expected Result             | Status |
| --------------------------- | --------------------------- | ------ |
| Valid stats                 | 201 Created + stats details | ⬜     |
| Invalid rating (0-10 range) | 400 Bad Request             | ⬜     |
| Negative values             | 400 Bad Request             | ⬜     |
| Duplicate player stats      | 400 Bad Request             | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/matches/MATCH_ID/player-stats
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "playerId": "PLAYER_ID",
  "goals": 2,
  "assists": 1,
  "rating": 8.5,
  "minutesPlayed": 90
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Player match stats added successfully",
	"data": {
		"id": "stats_id",
		"playerId": "PLAYER_ID",
		"matchId": "MATCH_ID",
		"goals": 2,
		"assists": 1,
		"rating": 8.5,
		"minutesPlayed": 90
	}
}
```

---

## 5. Stats Endpoints (`/api/stats`)

### 5.1 Player Leaderboards

**Endpoint**: `GET /api/stats/leaderboards`  
**Purpose**: Get player rankings  
**Query Parameters**: `statType`, `seasonId`, `position`, `limit`

#### Test Cases

| Test Scenario       | Expected Result           | Status |
| ------------------- | ------------------------- | ------ |
| Goals leaderboard   | 200 OK + goals ranking    | ⬜     |
| Assists leaderboard | 200 OK + assists ranking  | ⬜     |
| Rating leaderboard  | 200 OK + rating ranking   | ⬜     |
| Filter by position  | 200 OK + position ranking | ⬜     |
| Filter by season    | 200 OK + season ranking   | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/stats/leaderboards?statType=goals&seasonId=SEASON_ID&position=ST&limit=10
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"rank": 1,
			"player": {
				"id": "player_id",
				"gamertag": "TopScorer",
				"position": "ST"
			},
			"value": 25,
			"team": {
				"id": "team_id",
				"name": "Team Name"
			}
		}
	]
}
```

---

### 5.2 Team Statistics

**Endpoint**: `GET /api/stats/teams`  
**Purpose**: Get team performance stats  
**Query Parameters**: `seasonId`, `teamId`

#### Test Cases

| Test Scenario         | Expected Result          | Status |
| --------------------- | ------------------------ | ------ |
| All teams stats       | 200 OK + all teams stats | ⬜     |
| Specific team stats   | 200 OK + team stats      | ⬜     |
| Season-specific stats | 200 OK + season stats    | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/stats/teams?seasonId=SEASON_ID
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"team": {
				"id": "team_id",
				"name": "Team Name"
			},
			"stats": {
				"matchesPlayed": 10,
				"wins": 7,
				"draws": 2,
				"losses": 1,
				"goalsFor": 25,
				"goalsAgainst": 12,
				"points": 23
			}
		}
	]
}
```

---

### 5.3 Season Summary

**Endpoint**: `GET /api/stats/seasons/:id/summary`  
**Purpose**: Get comprehensive season statistics  
**Authentication**: None required

#### Test Cases

| Test Scenario        | Expected Result         | Status |
| -------------------- | ----------------------- | ------ |
| Valid season ID      | 200 OK + season summary | ⬜     |
| Invalid season ID    | 404 Not Found           | ⬜     |
| Complete season data | 200 OK + full summary   | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/stats/seasons/SEASON_ID/summary
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"season": {
			"id": "season_id",
			"name": "Season 2024"
		},
		"summary": {
			"totalMatches": 45,
			"totalGoals": 156,
			"averageGoalsPerMatch": 3.47,
			"topScorer": {
				"player": "TopScorer",
				"goals": 25
			},
			"topAssister": {
				"player": "TopAssister",
				"assists": 18
			}
		}
	}
}
```

---

## 6. Seasons Endpoints (`/api/seasons`)

### 6.1 List All Seasons

**Endpoint**: `GET /api/seasons`  
**Purpose**: Get all seasons  
**Query Parameters**: `status`, `limit`

#### Test Cases

| Test Scenario     | Expected Result            | Status |
| ----------------- | -------------------------- | ------ |
| All seasons       | 200 OK + seasons array     | ⬜     |
| Active seasons    | 200 OK + active seasons    | ⬜     |
| Completed seasons | 200 OK + completed seasons | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/seasons?status=ACTIVE
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"id": "season_id",
			"name": "Season 2024",
			"startDate": "2024-01-01",
			"endDate": "2024-12-31",
			"status": "ACTIVE",
			"description": "FC 26 Pro Clubs Season 2024"
		}
	]
}
```

---

### 6.2 Create Season

**Endpoint**: `POST /api/seasons`  
**Purpose**: Create new season  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario              | Expected Result              | Status |
| -------------------------- | ---------------------------- | ------ |
| Valid season creation      | 201 Created + season details | ⬜     |
| End date before start date | 400 Bad Request              | ⬜     |
| Missing required fields    | 400 Bad Request              | ⬜     |
| Unauthorized access        | 401 Unauthorized             | ⬜     |

#### Sample Request

```json
POST http://localhost:3000/api/seasons
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "name": "Season 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "description": "FC 26 Pro Clubs Season 2024"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Season created successfully",
	"data": {
		"id": "season_id",
		"name": "Season 2024",
		"startDate": "2024-01-01",
		"endDate": "2024-12-31",
		"description": "FC 26 Pro Clubs Season 2024",
		"status": "ACTIVE"
	}
}
```

---

### 6.3 Get Season by ID

**Endpoint**: `GET /api/seasons/:id`  
**Purpose**: Get detailed season information  
**Authentication**: None required

#### Test Cases

| Test Scenario     | Expected Result         | Status |
| ----------------- | ----------------------- | ------ |
| Valid season ID   | 200 OK + season details | ⬜     |
| Invalid season ID | 404 Not Found           | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/seasons/SEASON_ID
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"id": "season_id",
		"name": "Season 2024",
		"startDate": "2024-01-01",
		"endDate": "2024-12-31",
		"status": "ACTIVE",
		"description": "FC 26 Pro Clubs Season 2024",
		"teams": [
			{
				"id": "team_id",
				"name": "Team Name"
			}
		]
	}
}
```

---

### 6.4 Update Season

**Endpoint**: `PUT /api/seasons/:id`  
**Purpose**: Update season information  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario       | Expected Result         | Status |
| ------------------- | ----------------------- | ------ |
| Valid updates       | 200 OK + updated season | ⬜     |
| Unauthorized access | 403 Forbidden           | ⬜     |
| Invalid date ranges | 400 Bad Request         | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/seasons/SEASON_ID
Authorization: Bearer MANAGER_TOKEN
Content-Type: application/json

{
  "status": "COMPLETED",
  "endDate": "2024-06-30"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "Season updated successfully",
	"data": {
		"id": "season_id",
		"status": "COMPLETED",
		"endDate": "2024-06-30"
	}
}
```

---

### 6.5 Delete Season

**Endpoint**: `DELETE /api/seasons/:id`  
**Purpose**: Remove season  
**Authentication**: Required (Manager/Admin role)

#### Test Cases

| Test Scenario              | Expected Result          | Status |
| -------------------------- | ------------------------ | ------ |
| Delete with manager token  | 200 OK + success message | ⬜     |
| Delete with player token   | 403 Forbidden            | ⬜     |
| Delete non-existent season | 404 Not Found            | ⬜     |

#### Sample Request

```
DELETE http://localhost:3000/api/seasons/SEASON_ID
Authorization: Bearer MANAGER_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"message": "Season deleted successfully"
}
```

---

## 7. Users Endpoints (`/api/users`)

### 7.1 List All Users

**Endpoint**: `GET /api/users`  
**Purpose**: Get all users (Admin only)  
**Authentication**: Required (Admin role)

#### Test Cases

| Test Scenario           | Expected Result      | Status |
| ----------------------- | -------------------- | ------ |
| With competition admin  | 200 OK + users array | ⬜     |
| With league admin token | 403 Forbidden        | ⬜     |
| With team admin token   | 403 Forbidden        | ⬜     |
| With player token       | 403 Forbidden        | ⬜     |
| Without token           | 401 Unauthorized     | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/users
Authorization: Bearer COMPETITION_ADMIN_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"data": [
		{
			"id": "user_id",
			"username": "admin",
			"email": "admin@test.com",
			"role": "ADMIN",
			"createdAt": "2024-01-01T00:00:00Z"
		}
	]
}
```

---

### 7.2 Get User by ID

**Endpoint**: `GET /api/users/:id`  
**Purpose**: Get user information  
**Authentication**: Required (own profile or Admin role)

#### Test Cases

| Test Scenario               | Expected Result       | Status |
| --------------------------- | --------------------- | ------ |
| Own profile                 | 200 OK + user details | ⬜     |
| Admin accessing other user  | 200 OK + user details | ⬜     |
| Player accessing other user | 403 Forbidden         | ⬜     |
| Non-existent user           | 404 Not Found         | ⬜     |

#### Sample Request

```
GET http://localhost:3000/api/users/USER_ID
Authorization: Bearer USER_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"data": {
		"id": "user_id",
		"username": "username",
		"email": "email@test.com",
		"role": "PLAYER",
		"createdAt": "2024-01-01T00:00:00Z",
		"players": [
			{
				"id": "player_id",
				"gamertag": "Gamertag"
			}
		]
	}
}
```

---

### 7.3 Update User

**Endpoint**: `PUT /api/users/:id`  
**Purpose**: Update user information  
**Authentication**: Required (own profile or Admin role)

#### Test Cases

| Test Scenario              | Expected Result       | Status |
| -------------------------- | --------------------- | ------ |
| Update own profile         | 200 OK + updated user | ⬜     |
| Admin updating other user  | 200 OK + updated user | ⬜     |
| Player updating other user | 403 Forbidden         | ⬜     |
| Invalid role updates       | 400 Bad Request       | ⬜     |

#### Sample Request

```json
PUT http://localhost:3000/api/users/USER_ID
Authorization: Bearer USER_TOKEN
Content-Type: application/json

{
  "username": "newusername"
}
```

#### Expected Response

```json
{
	"success": true,
	"message": "User updated successfully",
	"data": {
		"id": "user_id",
		"username": "newusername"
	}
}
```

---

### 7.4 Delete User

**Endpoint**: `DELETE /api/users/:id`  
**Purpose**: Remove user  
**Authentication**: Required (Admin role)

#### Test Cases

| Test Scenario             | Expected Result          | Status |
| ------------------------- | ------------------------ | ------ |
| Delete with admin token   | 200 OK + success message | ⬜     |
| Delete with manager token | 403 Forbidden            | ⬜     |
| Delete with player token  | 403 Forbidden            | ⬜     |
| Delete non-existent user  | 404 Not Found            | ⬜     |

#### Sample Request

```
DELETE http://localhost:3000/api/users/USER_ID
Authorization: Bearer ADMIN_TOKEN
```

#### Expected Response

```json
{
	"success": true,
	"message": "User deleted successfully"
}
```

---

## Testing Checklist

### Authentication & Authorization

- [ ] JWT token generation works
- [ ] Token validation works
- [ ] Role-based access control works
- [ ] Password hashing works
- [ ] Token expiration works

### Data Validation

- [ ] Required fields are enforced
- [ ] Data types are validated
- [ ] Business rules are enforced
- [ ] Error messages are clear

### Database Operations

- [ ] CRUD operations work
- [ ] Relationships are maintained
- [ ] Transactions work properly
- [ ] Data integrity is preserved

### Error Handling

- [ ] 400 errors for bad requests
- [ ] 401 errors for unauthorized
- [ ] 403 errors for forbidden
- [ ] 404 errors for not found
- [ ] 500 errors for server issues

### Performance

- [ ] Response times are reasonable
- [ ] Pagination works
- [ ] Rate limiting works
- [ ] No memory leaks

---

## Quick Test Commands

### Start Testing

```bash
# 1. Start your server
npm run dev

# 2. In another terminal, test health endpoint
curl http://localhost:3000/health

# 3. Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123","gamertag":"TestUser"}'
```

### Test Database Connection

```bash
# Check if database is accessible
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Test with curl

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123","gamertag":"TestUser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

---

## What to Look For

1. **Missing Features**: Endpoints that don't work or return errors
2. **Data Issues**: Incorrect responses or missing data
3. **Security Gaps**: Endpoints that should be protected but aren't
4. **Validation Problems**: Bad data being accepted
5. **Performance Issues**: Slow responses or timeouts
6. **Error Handling**: Unclear error messages or crashes

---

## Testing Workflow

1. **Start with Health Check**: Ensure server is running
2. **Test Authentication**: Register, login, get profile
3. **Test Public Endpoints**: Teams, players, seasons (GET)
4. **Test Protected Endpoints**: Create, update, delete operations
5. **Test Edge Cases**: Invalid data, unauthorized access
6. **Test Relationships**: Team assignments, match stats
7. **Test Statistics**: Leaderboards, summaries
8. **Performance Testing**: Response times, pagination

---

## Common Issues & Solutions

### Database Connection Issues

- **Error**: `P1001: Can't reach database server`
- **Solution**: Ensure PostgreSQL container is running (`docker ps`)

### Authentication Issues

- **Error**: `401 Unauthorized`
- **Solution**: Check JWT token format and expiration

### Validation Issues

- **Error**: `400 Bad Request`
- **Solution**: Verify required fields and data types

### Permission Issues

- **Error**: `403 Forbidden`
- **Solution**: Check user role and endpoint permissions

---

## Next Steps After Testing

1. **Document Issues**: Note any endpoints that don't work
2. **Prioritize Fixes**: Focus on critical functionality first
3. **Test Edge Cases**: Try unusual data combinations
4. **Performance Testing**: Check response times under load
5. **Security Testing**: Verify authorization works correctly

---

_This testing guide covers all endpoints in the FC 26 Pro Clubs Stats Hub Backend API. Use it systematically to ensure all functionality works as expected._
