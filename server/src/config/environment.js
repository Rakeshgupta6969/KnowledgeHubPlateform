const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL,
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};

if (config.env === 'production') {
  if (
    config.accessTokenSecret === 'dev_access_secret_key' ||
    config.refreshTokenSecret === 'dev_refresh_secret_key'
  ) {
    console.warn(
      '[SECURITY WARNING] Production environment detected with default JWT secrets! Ensure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are explicitly configured in production.'
    );
  }
}

module.exports = config;
