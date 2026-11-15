const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const tenantRoutes = require('../modules/tenants/tenant.routes');
const categoryRoutes = require('../modules/categories/category.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenant', tenantRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
