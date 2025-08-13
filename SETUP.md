# Dare2Earn - Local PostgreSQL Setup

This project has been converted from Supabase to use a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL installed locally**
   - Download from: https://www.postgresql.org/download/
   - Make sure PostgreSQL service is running
   - Default password should be set to `1229` or update the `.env` file

2. **Node.js and npm**
   - Node.js 16+ required
   - npm comes with Node.js

## Setup Instructions

### 1. Database Setup

```bash
# Create the database (run as postgres user)
createdb -U postgres dare2earn

# Or using psql
psql -U postgres
CREATE DATABASE dare2earn;
\q

# Initialize the database with schema
npm run db:init
```

Alternative manual setup:
```bash
psql -U postgres -d dare2earn -f database/init.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The `.env` file has been updated with local database settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dare2earn
DB_USER=postgres
DB_PASSWORD=1229

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-dare2earn-2025
JWT_EXPIRES_IN=7d

# React App Configuration
REACT_APP_API_URL=http://localhost:5000
```

**Important:** Change the `JWT_SECRET` in production!

### 4. Running the Application

#### Option 1: Run both client and server together (recommended)
```bash
npm run dev
```
This will start:
- Express server on http://localhost:5000
- React development server on http://localhost:3000

#### Option 2: Run separately
```bash
# Terminal 1 - Start the server
npm run server:dev

# Terminal 2 - Start the React app
npm start
```

### 5. Verify Setup

1. Check database connection:
   - Visit: http://localhost:5000/health
   - Should show healthy database status

2. Test the application:
   - Visit: http://localhost:3000
   - Try creating an account
   - Login with your credentials

## Key Changes from Supabase

### Authentication
- **Before:** Supabase Auth with magic links and OAuth
- **After:** JWT-based authentication with local user management
- **Note:** Magic links and OAuth are disabled (can be added later)

### Database
- **Before:** Supabase managed PostgreSQL with RLS
- **After:** Local PostgreSQL with custom API endpoints
- **Schema:** Preserved all table structures and relationships

### File Storage
- **Before:** Supabase Storage
- **After:** Local file storage (to be implemented)
- **Note:** File uploads will need separate implementation

### API Access
- **Before:** Direct Supabase client calls
- **After:** REST API through Express server
- **Compatibility:** Maintained similar interface for easier migration

## Database Schema

The database includes these main tables:
- `users` - User accounts with authentication
- `user_sessions` - JWT session management
- `categories` - Dare categories
- `dares` - Challenge definitions
- `dare_participants` - User participation in dares
- `votes` - Voting on submissions
- `transactions` - Payment tracking
- `notifications` - User notifications
- `file_uploads` - File metadata (for future file storage)

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `POST /auth/logout` - Logout
- `GET /auth/user` - Get current user
- `PUT /auth/user` - Update profile

### Application
- `GET /api/categories` - List categories
- `GET /api/dares` - List dares (with pagination)
- `GET /api/dares/:id` - Get dare details
- `POST /api/dares` - Create dare (authenticated)
- `POST /api/dares/:id/join` - Join dare (authenticated)
- `POST /api/dares/:id/submit` - Submit to dare (authenticated)
- `POST /api/participants/:id/vote` - Vote on submission (authenticated)

### User Data
- `GET /api/users/my-dares` - User's created dares
- `GET /api/users/my-participations` - User's participations
- `GET /api/users/my-transactions` - User's transactions
- `GET /api/users/my-notifications` - User's notifications

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running: `pg_ctl status`
2. Check credentials in `.env` file
3. Verify database exists: `psql -U postgres -l`

### Permission Errors
1. Make sure postgres user has proper permissions
2. Try running: `psql -U postgres -c "ALTER USER postgres CREATEDB;"`

### Port Conflicts
1. Change `PORT=5000` in `.env` if port 5000 is in use
2. Update `REACT_APP_API_URL` accordingly

### Installation Issues
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Next Steps

1. **File Upload Implementation**
   - Add multer for file handling
   - Implement local file storage
   - Update API endpoints for file uploads

2. **Email Service**
   - Add email service for notifications
   - Implement magic link functionality
   - Add email verification

3. **Payment Integration**
   - Implement Telebirr API integration
   - Add Chapa payment gateway
   - Complete transaction processing

4. **Production Deployment**
   - Set up production database
   - Configure environment variables
   - Add SSL certificates
   - Set up reverse proxy (nginx)

## Support

If you encounter any issues during setup:

1. Check PostgreSQL logs: `sudo journalctl -u postgresql`
2. Check server logs in the terminal
3. Verify all dependencies are installed
4. Ensure firewall allows connections to ports 3000 and 5000
