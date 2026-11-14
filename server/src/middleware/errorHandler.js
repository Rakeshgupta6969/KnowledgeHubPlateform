const ApiError = require('../utils/errors');
const config = require('../config/environment');

function errorHandler(err, req, res, _next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || undefined;
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.code === 'P2002') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with that unique value already exists';
  } else {
    // Unhandled error
    if (config.env !== 'test') {
      console.error('Unhandled Exception:', err);
    }
  }

  const response = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
