const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { healthCheck } = require('./database');
const auth = require('./auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Dare2Earn API Server',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      api: '/api/*'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await healthCheck();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    uptime: process.uptime()
  });
});

// Authentication routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username, full_name, phone_number } = req.body;
    
    // Basic validation
    if (!email || !password || !username) {
      return res.status(400).json({ 
        error: 'Email, password, and username are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }
    
    const result = await auth.signUp(
      email.trim().toLowerCase(), 
      password, 
      username.trim(), 
      full_name?.trim(), 
      phone_number?.trim()
    );
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create account' 
    });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    const result = await auth.signIn(email.trim().toLowerCase(), password);
    
    res.json({
      success: true,
      message: 'Signed in successfully',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to sign in' 
    });
  }
});

app.post('/auth/logout', auth.authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await auth.removeSession(token);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Failed to log out' 
    });
  }
});

app.get('/auth/user', auth.authenticateToken, async (req, res) => {
  try {
    const user = await auth.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ 
      error: error.message || 'User not found' 
    });
  }
});

app.put('/auth/user', auth.authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const updatedUser = await auth.updateUserProfile(req.user.id, updates);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update profile' 
    });
  }
});

app.post('/auth/change-password', auth.authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }
    
    await auth.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to change password' 
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  // Clean up expired sessions every hour
  setInterval(() => {
    auth.cleanupExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000);
});

module.exports = app;
