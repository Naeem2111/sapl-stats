# Competition Admin API Guide

This guide provides comprehensive documentation for all API endpoints available to users with the `COMPETITION_ADMIN` role. Competition admins have full access to the system, including features not yet built in the frontend.

## Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role Hierarchy

- **COMPETITION_ADMIN**: Full system access (highest level)
- **LEAGUE_ADMIN**: User management, team management, season management
- **TEAM_ADMIN**: Team management, player management
- **PLAYER**: View own stats, view team info

## Core Endpoints

### 1. Authentication (`/api/auth`)

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "password123",
  "role": "LEAGUE_ADMIN"
}
```

#### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 2. User Management (`/api/users`)

**Access**: COMPETITION_ADMIN, LEAGUE_ADMIN

#### Get All Users

```http
GET /api/users?role=LEAGUE_ADMIN&search=john&page=1&limit=20
Authorization: Bearer <token>
```

#### Get User by ID

```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create New User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "TEAM_ADMIN",
  "gamertag": "Gamer123",
  "realName": "John Doe",
  "position": "ST",
  "teamId": "team-id-here"
}
```

#### Update User

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@example.com",
  "role": "LEAGUE_ADMIN"
}
```

#### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Change User Password

```http
PUT /api/users/:id/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPassword": "newpassword123"
}
```

#### Get User Statistics

```http
GET /api/users/:id/stats?season=season-id
Authorization: Bearer <token>
```

### 3. Team Management (`/api/teams`)

**Access**: Public (GET), COMPETITION_ADMIN, LEAGUE_ADMIN (POST/PUT), COMPETITION_ADMIN (DELETE)

#### Get All Teams

```http
GET /api/teams
```

#### Get Team by ID

```http
GET /api/teams/:id
```

#### Create New Team

```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Arsenal FC",
  "logoUrl": "https://example.com/arsenal-logo.png"
}
```

#### Update Team

```http
PUT /api/teams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Arsenal Football Club",
  "logoUrl": "https://example.com/new-arsenal-logo.png"
}
```

#### Delete Team

```http
DELETE /api/teams/:id
Authorization: Bearer <token>
```

#### Get Team Statistics

```http
GET /api/teams/:id/stats?season=season-id
Authorization: Bearer <token>
```

### 4. Season Management (`/api/seasons`)

**Access**: Public (GET), COMPETITION_ADMIN, LEAGUE_ADMIN (POST/PUT), COMPETITION_ADMIN (DELETE)

#### Get All Seasons

```http
GET /api/seasons
```

#### Get Season by ID

```http
GET /api/seasons/:id
```

#### Create New Season

```http
POST /api/seasons
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Season 30",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z"
}
```

#### Update Season

```http
PUT /api/seasons/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Season 30 - Extended",
  "endDate": "2026-03-31T23:59:59Z"
}
```

#### Delete Season

```http
DELETE /api/seasons/:id
Authorization: Bearer <token>
```

#### Get Season Standings

```http
GET /api/seasons/:id/standings
```

### 5. Competition Management (`/api/competitions`)

**Access**: COMPETITION_ADMIN, LEAGUE_ADMIN

#### Get Competitions Overview

```http
GET /api/competitions/overview
Authorization: Bearer <token>
```

#### Get Competition Details

```http
GET /api/competitions/:id
Authorization: Bearer <token>
```

#### Create New Competition

```http
POST /api/competitions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premier League 2025",
  "startDate": "2025-08-01T00:00:00Z",
  "endDate": "2026-05-31T23:59:59Z",
  "description": "Top tier football competition"
}
```

#### Update Competition

```http
PUT /api/competitions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premier League 2025-26",
  "endDate": "2026-06-30T23:59:59Z"
}
```

#### Delete Competition

```http
DELETE /api/competitions/:id
Authorization: Bearer <token>
```

#### Get Competition Standings

```http
GET /api/competitions/:id/standings
Authorization: Bearer <token>
```

#### Get Competition Analytics

```http
GET /api/competitions/:id/analytics
Authorization: Bearer <token>
```

### 6. System Administration (`/api/admin`)

**Access**: COMPETITION_ADMIN only

#### Get System Overview

```http
GET /api/admin/system-overview
Authorization: Bearer <token>
```

#### Get Database Health

```http
GET /api/admin/database-health
Authorization: Bearer <token>
```

#### Get Audit Logs

```http
GET /api/admin/audit-logs?page=1&limit=50&action=USER_LOGIN
Authorization: Bearer <token>
```

#### Get System Configuration

```http
GET /api/admin/configuration
Authorization: Bearer <token>
```

#### Update System Configuration

```http
PUT /api/admin/configuration
Authorization: Bearer <token>
Content-Type: application/json

{
  "feature": "badgeSystem",
  "enabled": true,
  "value": "enhanced"
}
```

#### Get Maintenance Information

```http
GET /api/admin/maintenance
Authorization: Bearer <token>
```

#### Trigger Manual Backup

```http
POST /api/admin/maintenance/backup
Authorization: Bearer <token>
```

#### Get Performance Metrics

```http
GET /api/admin/performance?timeframe=24h
Authorization: Bearer <token>
```

#### Get Security Information

```http
GET /api/admin/security
Authorization: Bearer <token>
```

## Advanced Features

### 1. Bulk Operations

While not yet implemented, the system architecture supports:

- Bulk user creation/import
- Bulk team assignment
- Mass season updates
- Batch statistics processing

### 2. Real-time Notifications

Future implementation will include:

- WebSocket connections for live updates
- Push notifications for important events
- Email alerts for system issues

### 3. Advanced Analytics

Planned features include:

- Machine learning-based performance predictions
- Advanced statistical modeling
- Custom report generation
- Data export in multiple formats

### 4. Integration Capabilities

Future enhancements will support:

- Third-party API integrations
- Webhook notifications
- External authentication providers
- Data synchronization with other systems

## Error Handling

All API endpoints return consistent error responses:

```json
{
	"success": false,
	"error": {
		"message": "Detailed error description"
	}
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: `X-RateLimit-*` headers included in responses

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Helmet security headers
- Rate limiting protection

## Development Notes

### Testing Endpoints

Use the provided Postman collection or test with curl:

```bash
# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Use token for authenticated requests
curl -X GET http://localhost:3000/api/admin/system-overview \
  -H "Authorization: Bearer <your-token>"
```

### Database Schema

The system uses Prisma with PostgreSQL. Key models:

- `User`: User accounts and roles
- `Team`: Football teams
- `Player`: Player profiles
- `Season`: Competition seasons
- `Match`: Individual matches
- `PlayerMatchStat`: Player performance in matches
- `Badge`: Achievement badges
- `AwardedBadge`: Badge assignments

### Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

## Support and Development

For questions or feature requests:

1. Check the main README.md for setup instructions
2. Review the database schema in `prisma/schema.prisma`
3. Test endpoints using the provided Postman collection
4. Check server logs for detailed error information

## Future Roadmap

### Phase 1 (Current)

- ✅ Basic CRUD operations
- ✅ Role-based access control
- ✅ Authentication system
- ✅ Basic statistics

### Phase 2 (Next)

- 🔄 Advanced analytics dashboard
- 🔄 Real-time notifications
- 🔄 Bulk operations
- 🔄 Advanced reporting

### Phase 3 (Future)

- 📋 Machine learning integration
- 📋 Mobile app support
- 📋 Third-party integrations
- 📋 Advanced security features

---

**Note**: This API is designed to be extensible. Competition admins have access to all current and future features through the role-based permission system.


