const express = require('express');
const publicController = require('./public.controller');

const router = express.Router({ mergeParams: true });

// GET /api/v1/public/:tenantSlug - Public tenant branding & metadata
router.get('/:tenantSlug', publicController.getTenantConfig);

// GET /api/v1/public/:tenantSlug/categories - Public category list with published counts
router.get('/:tenantSlug/categories', publicController.getCategories);

// GET /api/v1/public/:tenantSlug/articles - List published articles
router.get('/:tenantSlug/articles', publicController.getArticles);

// GET /api/v1/public/:tenantSlug/articles/:articleSlug - Read single published article
router.get('/:tenantSlug/articles/:articleSlug', publicController.getArticleBySlug);

module.exports = router;
