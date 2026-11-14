const prisma = require('../config/prisma');
const ApiError = require('../utils/errors');
const { verifyAccessToken } = require('../utils/tokens');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication token is required', 'TOKEN_REQUIRED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Authentication token has expired', 'TOKEN_EXPIRED'));
      }
      return next(ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return next(ApiError.unauthorized('User account not found', 'USER_NOT_FOUND'));
    }

    if (user.status !== 'ACTIVE') {
      return next(ApiError.forbidden('User account is suspended', 'USER_SUSPENDED'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
