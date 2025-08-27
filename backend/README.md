# Pro Clubs Stats Hub - Backend

A comprehensive backend API for managing FC 26 Pro Clubs league statistics, built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **User Management**: Registration, authentication, and role-based access control
- **Team Management**: Create, update, and manage teams with player assignments
- **Player Statistics**: Track individual and team performance metrics
- **Match Management**: Record match results and player performance
- **Season Management**: Organize competitions into seasons
- **Advanced Analytics**: Leaderboards, comparisons, and statistical insights
- **RESTful API**: Clean, well-documented endpoints
- **Security**: JWT authentication, role-based permissions, input validation

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the environment example file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/proclubs_stats"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📊 Database Schema

The system uses a relational database with the following main entities:

- **Users**: Account management and authentication
- **Players**: Individual player profiles and gamertags
- **Teams**: Team information and management
- **Seasons**: Competition periods and organization
- **Matches**: Game results and scheduling
- **Player Match Stats**: Individual performance per match
- **Player Season Stats**: Aggregated season performance

## 🔐 Authentication & Authorization

### User Roles

- **COMPETITION_ADMIN**: Full system access, competition management
- **LEAGUE_ADMIN**: League-wide access, team management
- **TEAM_ADMIN**: Team-specific operations, player management
- **PLAYER**: View own stats, limited operations

### JWT Tokens

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Users

- `GET /api/users` - List all users (Competition Admin only)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Competition Admin only)

### Teams

- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams` - Create new team (Team Admin+)
- `PUT /api/teams/:id` - Update team (Team Admin+)
- `DELETE /api/teams/:id` - Delete team (Team Admin+)
- `GET /api/teams/:id/stats` - Get team statistics

### Players

- `GET /api/players` - List all players
- `GET /api/players/:id` - Get player profile
- `PUT /api/players/:id` - Update player (Team Admin+)
- `POST /api/players/:id/assign-team` - Assign to team (Team Admin+)
- `DELETE /api/players/:id/remove-team` - Remove from team (Team Admin+)
- `GET /api/players/:id/stats` - Get player statistics

### Matches

- `GET /api/matches` - List all matches
- `GET /api/matches/:id` - Get match details
- `POST /api/matches` - Create new match (Team Admin+)
- `PUT /api/matches/:id` - Update match (Team Admin+)
- `POST /api/matches/:id/stats` - Add player stats (Team Admin+)
- `GET /api/matches/:id/stats-summary` - Get match summary

### Statistics

- `GET /api/stats/leaderboard` - Get performance leaderboards
- `GET /api/stats/team-comparison` - Compare team performance
- `GET /api/stats/season-summary/:id` - Get season statistics
- `GET /api/stats/position-stats` - Get position-based statistics

### Seasons

- `GET /api/seasons` - List all seasons
- `GET /api/seasons/:id` - Get season details
- `POST /api/seasons` - Create new season (Team Admin+)
- `PUT /api/seasons/:id` - Update season (Team Admin+)
- `DELETE /api/seasons/:id` - Delete season (Team Admin+)
- `GET /api/seasons/current/active` - Get active season

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Project Structure

```
src/
├── database/
│   └── prisma.js          # Database connection
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js     # Error handling
│   └── notFound.js        # 404 handler
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management
│   ├── teams.js           # Team management
│   ├── players.js         # Player management
│   ├── matches.js         # Match management
│   ├── stats.js           # Statistics and analytics
│   └── seasons.js         # Season management
└── server.js              # Main server file
```

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Import and add to `src/server.js`
3. Follow the existing pattern for validation and error handling

### Database Changes

1. Update the Prisma schema in `prisma/schema.prisma`
2. Generate a new migration: `npm run db:migrate`
3. Update the Prisma client: `npm run db:generate`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=users.test.js
```

## 🚀 Deployment

### Production Considerations

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up database connection pooling
5. Use environment variables for sensitive data
6. Implement proper logging and monitoring

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run db:generate
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🆘 Support

For questions or issues:

- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔮 Future Enhancements

- Real-time match updates with WebSockets
- Advanced analytics and machine learning insights
- Mobile app API endpoints
- Integration with external gaming platforms
- Automated statistics calculation
- Performance optimization and caching
