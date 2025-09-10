# SAPL Stats Frontend

React frontend application for FC 26 Pro Clubs league statistics system with SAPL integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Naeem2111/sapl-stats-frontend.git
cd sapl-stats-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start the development server
npm start
```

The application will be available at `http://localhost:3001`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Environment
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true

# App Configuration
REACT_APP_APP_NAME=SAPL Stats Hub
REACT_APP_VERSION=1.0.0
```

## 📱 Features

### Authentication

- User registration and login
- JWT token-based authentication
- Protected routes
- Role-based access control

### Statistics Dashboard

- Player statistics leaderboards
- Team comparison tools
- Season summaries
- Position-based statistics
- Player head-to-head comparisons

### Team Management

- Team creation and management
- Player roster management
- Team statistics tracking
- Match results recording

### Match Management

- Match creation and scheduling
- Score entry and validation
- Match statistics tracking
- Historical match data

### Admin Features

- User management
- Season management
- Competition setup
- Data import/export

## 🎨 UI Components

### Built with

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API calls

### Key Components

- `Dashboard` - Main statistics overview
- `PlayerStats` - Individual player statistics
- `TeamStats` - Team performance metrics
- `MatchResults` - Match data and results
- `AdminPanel` - Administrative functions
- `AuthForm` - Login/registration forms

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Vercel will automatically deploy on push to main branch

### Environment Variables for Production

```env
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false
```

### Build for Production

```bash
# Create production build
npm run build

# Serve the build locally (for testing)
npx serve -s build
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/
│   ├── PlayerStats/
│   ├── TeamStats/
│   ├── MatchResults/
│   ├── AdminPanel/
│   └── AuthForm/
├── contexts/           # React contexts
│   └── AuthContext.js
├── routes/            # Route components
│   ├── Dashboard.js
│   ├── Players.js
│   ├── Teams.js
│   ├── Matches.js
│   └── Admin.js
├── utils/             # Utility functions
│   └── api.js
├── middleware/        # Custom hooks and middleware
│   ├── useAuth.js
│   ├── useApi.js
│   └── ProtectedRoute.js
├── App.js            # Main App component
├── index.js          # Entry point
└── index.css         # Global styles
```

## 🎯 Key Features

### Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interfaces
- Cross-browser compatibility

### Performance

- Code splitting
- Lazy loading
- Optimized bundle size
- Fast loading times

### Accessibility

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast support

## 🔗 API Integration

The frontend communicates with the backend API through:

- **Authentication**: JWT token-based auth
- **Data Fetching**: Axios for HTTP requests
- **Error Handling**: Centralized error management
- **Loading States**: User-friendly loading indicators

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style

- ESLint configuration included
- Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

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

## 🔗 Related Repositories

- [Backend API](https://github.com/Naeem2111/sapl-stats-backend) - Node.js/Express backend
- [Documentation](https://github.com/Naeem2111/sapl-stats-docs) - Project documentation
