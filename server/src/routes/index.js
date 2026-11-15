const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const tenantRoutes = require('../modules/tenants/tenant.routes');
const categoryRoutes = require('../modules/categories/category.routes');
const articleRoutes = require('../modules/articles/article.routes');
const publicRoutes = require('../modules/public/public.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenant', tenantRoutes);
router.use('/categories', categoryRoutes);
router.use('/articles', articleRoutes);
router.use('/public', publicRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
