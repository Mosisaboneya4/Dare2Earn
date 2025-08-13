const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dare2earn',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1229',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executed`, { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed`, { text, duration, error: error.message });
    throw error;
  }
};

// Helper function to execute transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Database health check
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      connection_count: pool.totalCount,
      idle_count: pool.idleCount,
      waiting_count: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Cleanup function for graceful shutdown
const cleanup = async () => {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  pool,
  query,
  transaction,
  healthCheck,
  cleanup
};
