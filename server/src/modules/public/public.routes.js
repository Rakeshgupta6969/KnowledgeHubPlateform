const express = require('express');
const publicController = require('./public.controller');
const { searchLimiter, feedbackLimiter } = require('../../middleware/rateLimit');

const router = express.Router({ mergeParams: true });

// GET /api/v1/public/:tenantSlug - Public tenant branding & metadata
router.get('/:tenantSlug', publicController.getTenantConfig);

// GET /api/v1/public/:tenantSlug/search - Search published articles
router.get('/:tenantSlug/search', searchLimiter, publicController.searchArticles);

// GET /api/v1/public/:tenantSlug/categories - Public category list with published counts
router.get('/:tenantSlug/categories', publicController.getCategories);

// GET /api/v1/public/:tenantSlug/articles - List published articles
router.get('/:tenantSlug/articles', publicController.getArticles);

// GET /api/v1/public/:tenantSlug/articles/:articleSlug - Read single published article
router.get('/:tenantSlug/articles/:articleSlug', publicController.getArticleBySlug);

// POST /api/v1/public/:tenantSlug/articles/:articleSlug/feedback - Submit helpful feedback
router.post(
  '/:tenantSlug/articles/:articleSlug/feedback',
  feedbackLimiter,
  publicController.submitFeedback
);

// POST /api/v1/public/:tenantSlug/articles/:articleSlug/view - Record article view
router.post('/:tenantSlug/articles/:articleSlug/view', publicController.recordView);

module.exports = router;
