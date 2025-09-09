# Pro Clubs Stats Hub - Test Credentials

This document contains test account credentials for the Pro Clubs Stats Hub application.

## 🔑 Quick Test Accounts

### Admin Accounts

| Email                       | Password    | Role                | Description                  |
| --------------------------- | ----------- | ------------------- | ---------------------------- |
| `admin@proclubs.com`        | `admin123`  | `COMPETITION_ADMIN` | Main administrator account   |
| `league_admin@proclubs.com` | `league123` | `LEAGUE_ADMIN`      | League administrator account |
| `team_admin@proclubs.com`   | `team123`   | `TEAM_ADMIN`        | Team administrator account   |

### Player Accounts (All use password: `player123`)

| Email                         | Name             | Role   | Description                   |
| ----------------------------- | ---------------- | ------ | ----------------------------- |
| `i_abdoola@hotmail.com`       | Ismail Abdoola   | PLAYER | Player from imported CSV data |
| `yaseenabdoola7@gmail.com`    | Yaseen Abdoola   | PLAYER | Player from imported CSV data |
| `aneesabrahams89@gmail.com`   | Anees Abrahams   | PLAYER | Player from imported CSV data |
| `muammar24abrahams@gmail.com` | Mu'amar Abrahams | PLAYER | Player from imported CSV data |
| `mya.joey@gmail.com`          | Yusuf Ackers     | PLAYER | Player from imported CSV data |

## 📊 Database Summary

- **Total Users Imported:** 1,249 users
- **Players:** 1,249 imported from `PERSON_1166.csv`
- **League Administrators:** 0 imported (all were skipped as they were already imported)
- **Team Administrators:** 0 imported (all were skipped as they were already imported)

## 🔧 Setup Commands

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed
npm run db:import-users
npm run db:set-test-passwords
npm run db:create-admins

# Start backend server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm start
```

## 📱 Key Features

### Phone Number as Primary Identifier

- Users are identified by their phone numbers stored in `saplData.phone`
- Phone numbers are used for duplicate checking instead of emails
- All imported users have real phone numbers from the CSV data

### Data Structure

- **Users table:** Contains user authentication and basic info
- **Players table:** Contains player-specific data linked to users
- **Phone numbers:** Stored in `saplData.phone` as the primary identifier
- **SAPL integration:** Ready for LeagueRepublic API integration

### Imported Data

- **SAPL Person ID:** Original LeagueRepublic person ID
- **Real Names:** First and last names from CSV
- **Gamertags:** User names/gamertags from CSV
- **Teams:** Team associations from CSV
- **Phone Numbers:** Mobile and home phone numbers
- **Active Dates:** When users became active in the system

## 🚀 Next Steps

1. **Test the frontend** with the imported users
2. **Test admin login** with the new admin accounts
3. **Implement phone number-based login** if needed
4. **Set up password reset functionality** using phone numbers
5. **Import team data** from LeagueRepublic API
6. **Import match and statistics data**

## 📝 Notes

- All passwords were set to known values for testing purposes
- Real email addresses are used when available from CSV
- Generated placeholder emails are used when email is missing
- Phone numbers serve as the primary identifier for users
- All imported users have `Active` status in the original CSV

## 🔒 Security Note

These are test credentials for development purposes only. In production:

- Use strong, unique passwords
- Implement proper password reset functionality
- Consider phone number verification
- Implement proper authentication flows
