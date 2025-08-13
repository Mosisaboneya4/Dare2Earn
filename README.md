# Dare2Earn 🎯

A modern challenge-based earning platform where users can create and participate in dares to earn rewards. Built with React, Node.js, and PostgreSQL.

![Dare2Earn Platform](https://via.placeholder.com/800x400/1e293b/ffffff?text=Dare2Earn+Platform)

## ✨ Features

### 🔐 Authentication System
- **Beautiful modern login/signup interface** with gradient design
- **Role-based authentication** (Admin/User roles)
- **Secure password handling** with bcrypt hashing
- **JWT token-based sessions** with expiry management
- **Magic link authentication** support (coming soon)
- **Google OAuth integration** (coming soon)

### 👑 Admin Dashboard
- **Comprehensive admin panel** with real-time statistics
- **User management** - view, edit, and manage user accounts
- **Dare management** - oversee all challenges and activities
- **Analytics dashboard** with key metrics
- **Report handling** system for content moderation
- **Revenue tracking** and financial overview

### 👤 User Dashboard  
- **Personal stats tracking** - dares completed, earnings, rank
- **Challenge browser** - discover and join active dares
- **Earnings history** and reward management
- **Leaderboard integration** for competitive gaming
- **Profile customization** options

### 🎨 Modern UI/UX
- **Responsive design** works on all devices
- **Dark theme** with professional styling
- **Smooth animations** and micro-interactions
- **Intuitive navigation** and user flow
- **Accessible components** following WCAG guidelines

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **React Router** - Client-side routing
- **React Hot Toast** - Elegant notifications
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **CRACO** - Create React App Configuration Override
- **Concurrently** - Run multiple commands
- **Nodemon** - Development server auto-reload
- **PostCSS** - CSS post-processing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mosisaboneya4/Dare2Earn.git
   cd Dare2Earn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb -U postgres dare2earn
   
   # Run database initialization
   npm run db:init
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env with your database credentials
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dare2earn
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   # Backend: npm run server:dev
   # Frontend: npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:5001
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## 🎮 Usage

### Default Admin Account
```
Email: admin@dare2earn.com
Password: admin123
```

### User Registration
1. Navigate to the signup page
2. Enter your email and create a password
3. Complete the registration process
4. Start creating and joining dares!

## 📁 Project Structure

```
dare2earn/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── admin/        # Admin dashboard components
│   │   ├── user/         # User dashboard components
│   │   ├── Auth.jsx      # Authentication component
│   │   └── LandingPage.jsx
│   ├── App.js            # Main app component
│   └── supabaseClient.js # API client wrapper
├── server/               # Backend server
│   ├── routes/          # API routes
│   ├── auth.js          # Authentication logic
│   ├── database.js      # Database configuration
│   └── server.js        # Express server
├── database/            # Database scripts
└── supabase/           # Database migrations
```

## 🔒 Security Features

- **Password Hashing** - All passwords are securely hashed with bcrypt
- **JWT Authentication** - Secure token-based authentication
- **Session Management** - Automatic token expiry and cleanup
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Input sanitization and validation

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm start           # Start React development server
npm run server:dev  # Start backend with nodemon

# Database
npm run db:create   # Create database
npm run db:init     # Initialize database schema

# Production
npm run build       # Build React app for production
npm run server      # Start production server
```

### API Endpoints

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user
- `PUT /auth/user` - Update user profile

#### Health Check
- `GET /health` - Server health status
- `GET /` - API information

## 🎯 Roadmap

### Phase 1 (Current)
- [x] User authentication system
- [x] Role-based access control
- [x] Admin and user dashboards
- [x] Beautiful UI design

### Phase 2 (Next)
- [ ] Dare creation and management
- [ ] File upload for dare submissions
- [ ] Payment integration
- [ ] Real-time notifications

### Phase 3 (Future)
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Social features
- [ ] API rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need support:
- Open an issue on GitHub
- Email: support@dare2earn.com (coming soon)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first styling
- PostgreSQL for the robust database system
- All contributors and supporters of this project

---

**Built with ❤️ by the Dare2Earn Team**
