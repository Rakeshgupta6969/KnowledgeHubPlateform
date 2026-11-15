const express = require('express');
const analyticsController = require('./analytics.controller');
const authMiddleware = require('../../middleware/auth');
const tenantContextMiddleware = require('../../middleware/tenantContext');
const roleMiddleware = require('../../middleware/rbac');
const { validateQuery } = require('../../middleware/validate');
const { dateFilterSchema } = require('./analytics.validation');

const router = express.Router();

// Strict RBAC: All analytics routes require auth, verified tenant context, and OWNER or ADMIN role
router.use(
  authMiddleware,
  tenantContextMiddleware,
  roleMiddleware(['OWNER', 'ADMIN'])
);

// GET /api/v1/analytics/overview - Overall metrics (views, searches, feedback ratio)
router.get('/overview', validateQuery(dateFilterSchema), analyticsController.getOverview);

// GET /api/v1/analytics/articles - Top articles performance
router.get('/articles', validateQuery(dateFilterSchema), analyticsController.getTopArticles);

// GET /api/v1/analytics/searches - Popular searches and searches with no results
router.get('/searches', validateQuery(dateFilterSchema), analyticsController.getSearches);

module.exports = router;
