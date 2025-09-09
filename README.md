# Pro Clubs Stats Hub

A comprehensive statistics and management system for FC 26 Pro Clubs leagues, featuring a Node.js backend API and React frontend.

## 🏗️ Project Structure

```
proclubs-stats-hub/
├── backend/           # Node.js + Express API
│   ├── package.json
│   ├── .env
│   ├── prisma/        # Database schema and migrations
│   ├── src/           # Backend source code
│   └── README.md      # Backend documentation
├── frontend/          # React application
│   ├── package.json
│   ├── src/           # React components
│   ├── public/        # Static assets
│   └── README.md      # Frontend documentation
└── README.md          # This file
```

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18.0.0 or higher
- PostgreSQL database (see `backend/DATABASE_SETUP.md`)
- npm or yarn package manager

### **1. Backend Setup**

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The backend will run on `http://localhost:3000`

### **2. Frontend Setup**

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3001`

### **3. Import League Data (Optional)**

To import teams, fixtures, and all data from LeagueRepublic API:

#### **Interactive Import (Recommended)**

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

#### **What Gets Imported**

- All teams from 7 divisions/leagues
- Complete fixture schedule for selected season
- Current standings and results
- Season configuration and metadata

#### **Available Seasons**

- **Season 28** (2024) - Current season
- **Season 27** (2023) - Previous season
- **Season 26** (2022) - Historical season

See `backend/LEAGUEREPUBLIC_IMPORT_GUIDE.md` for detailed instructions.

## 🔐 Test Credentials

**Team Admin:**

- Email: `team_admin@proclubs.com`
- Password: `team123`

**League Admin:**

- Email: `league_admin@proclubs.com`
- Password: `league123`

**Competition Admin:**

- Email: `competition_admin@proclubs.com`
- Password: `admin123`

## 📚 Documentation

- **Backend**: See `backend/README.md` for API documentation
- **Frontend**: See `frontend/README.md` for UI documentation
- **Database**: See `backend/DATABASE_SETUP.md` for setup instructions
- **API Testing**: See `backend/API_TESTING_GUIDE.md` for endpoint testing

## 🛠️ Development

### **Backend Development**

```bash
cd backend
npm run dev          # Start development server
npm run db:studio    # Open Prisma Studio
npm test             # Run tests
```

### **Frontend Development**

```bash
cd frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
```

## 🌐 API Endpoints

- **Authentication**: `/api/auth/*`
- **Teams**: `/api/teams/*`
- **Players**: `/api/players/*`
- **Matches**: `/api/matches/*`
- **Statistics**: `/api/stats/*`
- **Seasons**: `/api/seasons/*`

## 🔧 Configuration

### **Backend Environment Variables**

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/proclubs_stats"
PORT=3000
JWT_SECRET=your_jwt_secret_here
```

### **Frontend Environment Variables**

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Port Conflicts**: Backend uses 3000, Frontend uses 3001
2. **Database Connection**: Ensure PostgreSQL is running
3. **CORS Issues**: Backend has CORS configured for frontend
4. **Authentication**: Check JWT token in browser localStorage

### **Getting Help**

- Check the individual README files in each directory
- Review the API testing guide
- Check browser console and terminal for error messages

## 📄 License

This project is licensed under the MIT License.
