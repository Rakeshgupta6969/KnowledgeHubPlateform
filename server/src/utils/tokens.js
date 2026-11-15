const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/environment');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiry,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiry,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.accessTokenSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshTokenSecret);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    path: '/api/v1',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
}

function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    path: '/api/v1',
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
};
