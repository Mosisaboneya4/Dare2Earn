const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('./database');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

// Helper function to generate secure tokens
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { 
      sub: userId, 
      email: email,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Create session in database
const createSession = async (userId, token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
  
  await query(
    'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
};

// Validate session
const validateSession = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const result = await query(`
    SELECT us.user_id, us.expires_at, u.email, u.username, u.full_name, u.is_active
    FROM user_sessions us
    JOIN users u ON us.user_id = u.id
    WHERE us.token_hash = $1 AND us.expires_at > NOW()
  `, [tokenHash]);
  
  if (result.rows.length === 0) {
    throw new Error('Invalid or expired session');
  }
  
  return result.rows[0];
};

// Remove session (logout)
const removeSession = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  await query('DELETE FROM user_sessions WHERE expires_at < NOW()');
};

// Sign up user
const signUp = async (email, password, username, fullName, phoneNumber) => {
  return await transaction(async (client) => {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert user directly instead of using the function
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, username, full_name, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, username, full_name, phone_number
    `, [email, passwordHash, username, fullName, phoneNumber]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Failed to create user');
    }
    
    const newUser = userResult.rows[0];
    
    // Generate token
    const token = generateToken(newUser.id, newUser.email);
    
    // Create session with the user ID from the database
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    await client.query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [newUser.id, tokenHash, expiresAt]
    );
    
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        phone_number: newUser.phone_number
      },
      token: token
    };
  });
};

// Sign in user
const signIn = async (email, password) => {
  // Find user by email
  const result = await query(
    'SELECT id, email, password_hash, username, full_name, phone_number, role, is_active FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('No account found with this email');
  }
  
  const user = result.rows[0];
  
  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }
  
  // Generate token
  const token = generateToken(user.id, user.email);
  
  // Create session
  await createSession(user.id, token);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role
    },
    token: token
  };
};

// Get user by ID
const getUserById = async (userId) => {
  const result = await query(`
    SELECT id, email, username, full_name, phone_number, profile_pic_url, bio, wallet_balance, email_verified, role, created_at
    FROM users 
    WHERE id = $1 AND is_active = true
  `, [userId]);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
};

// Update user profile
const updateUserProfile = async (userId, updates) => {
  const allowedFields = ['full_name', 'username', 'bio', 'phone_number', 'profile_pic_url'];
  const updateFields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  values.push(userId); // Add userId as the last parameter
  
  const result = await query(`
    UPDATE users 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex} 
    RETURNING id, email, username, full_name, phone_number, profile_pic_url, bio, wallet_balance
  `, values);
  
  return result.rows[0];
};

// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
  return await transaction(async (client) => {
    // Get current password hash
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );
    
    // Invalidate all existing sessions for this user
    await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
  });
};

// Middleware to protect routes
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const session = await validateSession(token);
    req.user = {
      id: session.user_id,
      email: session.email,
      username: session.username,
      full_name: session.full_name
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};

module.exports = {
  signUp,
  signIn,
  getUserById,
  updateUserProfile,
  changePassword,
  validateSession,
  removeSession,
  cleanupExpiredSessions,
  authenticateToken,
  generateToken,
  verifyToken
};
