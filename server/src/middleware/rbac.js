const ApiError = require('../utils/errors');

/**
 * Checks if user's membership has one of the allowed roles.
 * @param {string[]|string} allowedRoles - e.g. ['OWNER', 'ADMIN'] or 'ADMIN'
 */
function roleMiddleware(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.membership) {
      return next(ApiError.forbidden('Tenant membership context required', 'MEMBERSHIP_REQUIRED'));
    }

    const userRole = req.membership.role;
    if (!roles.includes(userRole)) {
      return next(ApiError.forbidden('Insufficient permissions to perform this action', 'FORBIDDEN'));
    }

    next();
  };
}

module.exports = roleMiddleware;
