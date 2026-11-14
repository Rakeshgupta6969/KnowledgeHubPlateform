const ApiError = require('../utils/errors');

function tenantContextMiddleware(req, res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED'));
  }

  const activeMemberships = (req.user.memberships || []).filter(
    (m) => m.status === 'ACTIVE'
  );

  if (activeMemberships.length === 0) {
    return next(ApiError.forbidden('User does not belong to any active workspace', 'NO_TENANT_MEMBERSHIP'));
  }

  let selectedMembership;
  // If client passed explicit tenant header, validate that it belongs to the user's active memberships
  const requestedTenantId = req.headers['x-tenant-id'];
  if (requestedTenantId) {
    selectedMembership = activeMemberships.find(
      (m) => m.tenantId === requestedTenantId || m.tenant?.id === requestedTenantId
    );
    if (!selectedMembership) {
      return next(ApiError.forbidden('You do not have access to the requested workspace', 'TENANT_ACCESS_DENIED'));
    }
  } else {
    // Default to the first active membership
    selectedMembership = activeMemberships[0];
  }

  // Ensure the tenant itself is active
  if (selectedMembership.tenant.status !== 'ACTIVE') {
    return next(ApiError.forbidden('This workspace is currently suspended', 'TENANT_INACTIVE'));
  }

  req.tenant = selectedMembership.tenant;
  req.membership = selectedMembership;

  next();
}

module.exports = tenantContextMiddleware;
