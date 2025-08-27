# Pro Clubs Stats Hub - Frontend

A modern, responsive React-based frontend for the FC 26 Pro Clubs league statistics system. Built with Tailwind CSS and designed specifically for team administrators and league administrators.

## 🚀 Features

### **Role-Based Access Control**

- **Team Administrators**: Manage their team's fixtures, roster, and player statistics
- **League Administrators**: Access to all teams plus league-wide statistics and standings
- **Competition Administrators**: Full system access with competition management capabilities

### **Core Functionality**

- **Fixtures & Results**: View and manage match schedules, results, and competition types
- **Team Management**: Manage team rosters, assign/remove players, and team settings
- **Player Statistics**: Analyze individual player performance with filtering and rankings
- **League Statistics**: Comprehensive league table, standings, and top performers
- **Settings**: User profile, security, and notification preferences

### **User Experience**

- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Modern UI**: Clean, intuitive interface using Tailwind CSS
- **Real-time Updates**: Live data integration with backend API
- **Role-Based Navigation**: Dynamic sidebar and content based on user permissions

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.2.0
- **Routing**: React Router DOM 6.3.0
- **Styling**: Tailwind CSS 3.3.0
- **HTTP Client**: Axios 1.4.0
- **Icons**: Lucide React 0.263.1
- **Date Handling**: date-fns 2.30.0
- **Build Tool**: Create React App 5.0.1

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js              # Login form component
│   │   └── ProtectedRoute.js     # Authentication guard
│   └── dashboard/
│       ├── Dashboard.js          # Main dashboard layout
│       ├── Sidebar.js            # Navigation sidebar
│       ├── Header.js             # Top header with breadcrumbs
│       ├── Fixtures.js           # Match management
│       ├── TeamManagement.js     # Team roster management
│       ├── PlayerStats.js        # Player statistics
│       ├── LeagueStats.js        # League-wide statistics
│       └── Settings.js           # User settings
├── contexts/
│   └── AuthContext.js            # Authentication state management
├── App.js                        # Main application component
├── index.js                      # Application entry point
└── index.css                     # Global styles and Tailwind imports
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Backend API running (see backend README)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd proclubs-stats-hub
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🔐 Authentication

The frontend integrates with the backend JWT authentication system:

- **Login**: Email/password authentication
- **Token Storage**: JWT tokens stored in localStorage
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Role-Based Access**: Dynamic UI based on user role permissions

## 🎨 Design System

### **Color Palette**

- **Primary**: Red tones (#ef4444) for main actions and branding
- **Secondary**: Gray tones for text and backgrounds
- **Accent**: Orange tones for highlights and secondary actions
- **Success**: Green for positive actions
- **Warning**: Yellow for caution states
- **Error**: Red for error states

### **Component Classes**

- **Cards**: `.card` - Consistent card styling with shadows
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Inputs**: `.input-field` - Form input styling
- **Navigation**: `.nav-link` - Sidebar navigation styling

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (lg, xl)

## 🔌 API Integration

The frontend communicates with the backend API endpoints:

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: `/auth/login`, `/auth/profile`
- **Teams**: `/teams`
- **Players**: `/players`
- **Matches**: `/matches`
- **Seasons**: `/seasons`
- **Statistics**: `/stats`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### **Environment Variables**

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development
```

### **Build and Deploy**

```bash
npm run build
```

Deploy the contents of the `build/` folder to your web server.

## 🔧 Development

### **Adding New Components**

1. Create component file in appropriate directory
2. Import and add to routing in `Dashboard.js`
3. Add navigation item in `Sidebar.js` if needed
4. Update role-based access control

### **Styling Guidelines**

- Use Tailwind CSS utility classes
- Follow the established color palette
- Maintain consistent spacing (4px grid system)
- Use responsive design patterns

### **State Management**

- Use React hooks for local state
- Context API for global authentication state
- Axios for API communication
- Local storage for persistent data

## 🐛 Troubleshooting

### **Common Issues**

1. **API Connection Errors**

   - Verify backend is running
   - Check API URL in environment variables
   - Ensure CORS is properly configured

2. **Authentication Issues**

   - Clear localStorage and re-login
   - Check JWT token expiration
   - Verify backend authentication endpoints

3. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)

## 🤝 Contributing

1. Follow the established code style
2. Add appropriate error handling
3. Include responsive design considerations
4. Test across different screen sizes
5. Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
