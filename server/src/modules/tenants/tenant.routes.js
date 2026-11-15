const express = require('express');
const tenantController = require('./tenant.controller');
const authMiddleware = require('../../middleware/auth');
const tenantContextMiddleware = require('../../middleware/tenantContext');
const roleMiddleware = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const { updateTenantSchema } = require('./tenant.validation');

const router = express.Router();

// GET /api/v1/tenant/current - requires auth and verified tenant context
router.get('/current', authMiddleware, tenantContextMiddleware, tenantController.getCurrent);

// PATCH /api/v1/tenant/current - requires OWNER or ADMIN role
router.patch(
  '/current',
  authMiddleware,
  tenantContextMiddleware,
  roleMiddleware(['OWNER', 'ADMIN']),
  validateBody(updateTenantSchema),
  tenantController.updateCurrent
);

module.exports = router;
