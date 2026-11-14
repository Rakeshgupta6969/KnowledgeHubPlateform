const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const tenantRoutes = require('../modules/tenants/tenant.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenant', tenantRoutes);

module.exports = router;
