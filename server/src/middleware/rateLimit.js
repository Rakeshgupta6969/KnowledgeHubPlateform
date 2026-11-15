const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message, code = 'RATE_LIMIT_EXCEEDED' }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code,
          message,
        },
      });
    },
  });
}

// 10 login attempts per 15 minutes per IP
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  code: 'LOGIN_RATE_LIMIT_EXCEEDED',
});

// 30 search queries per minute per IP
const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many search requests. Please slow down.',
  code: 'SEARCH_RATE_LIMIT_EXCEEDED',
});

// 15 feedback submissions per 15 minutes per IP
const feedbackLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many feedback submissions. Please try again later.',
  code: 'FEEDBACK_RATE_LIMIT_EXCEEDED',
});

module.exports = {
  loginLimiter,
  searchLimiter,
  feedbackLimiter,
};
