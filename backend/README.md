# SAPL Stats Backend API

Backend API for FC 26 Pro Clubs league statistics system with SAPL integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Naeem2111/sapl-stats-backend.git
cd sapl-stats-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start the development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Players

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Statistics

- `GET /api/stats/leaderboard` - Get statistics leaderboard
- `GET /api/stats/team-comparison` - Compare team statistics
- `GET /api/stats/season-summary/:seasonId` - Get season summary
- `GET /api/stats/position-stats` - Get position-based statistics
- `GET /api/stats/player-comparison` - Compare player statistics

### Matches

- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match by ID
- `POST /api/matches` - Create new match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### Seasons

- `GET /api/seasons` - Get all seasons
- `GET /api/seasons/:id` - Get season by ID
- `POST /api/seasons` - Create new season
- `PUT /api/seasons/:id` - Update season
- `DELETE /api/seasons/:id` - Delete season

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
NODE_ENV="development"
PORT=3000

# CORS Configuration
CORS_ORIGIN="http://localhost:3001"

# SAPL Integration (if using)
SAPL_API_KEY="your-sapl-api-key"
SAPL_BASE_URL="https://api.sapl.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database

This project uses PostgreSQL with Prisma ORM.

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push
```

## 🚀 Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on push to main branch

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..." # Railway provides this
JWT_SECRET="your-production-secret"
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend.vercel.app"
PORT=3000
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Health Check

The API includes a health check endpoint:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
	"status": "healthy",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"uptime": 123.456
}
```

## 🛡️ Security Features

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation with Joi
- Security headers with Helmet
- File upload limits

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
