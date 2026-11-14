const express = require('express');
const tenantController = require('./tenant.controller');
const authMiddleware = require('../../middleware/auth');
const tenantContextMiddleware = require('../../middleware/tenantContext');

const router = express.Router();

// GET /api/v1/tenant/current - requires auth and verified tenant context
router.get('/current', authMiddleware, tenantContextMiddleware, tenantController.getCurrent);

module.exports = router;
