const express = require('express');
const articleController = require('./article.controller');
const authMiddleware = require('../../middleware/auth');
const tenantContextMiddleware = require('../../middleware/tenantContext');
const roleMiddleware = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const { createArticleSchema, updateArticleSchema } = require('./article.validation');

const router = express.Router();

// All article routes require authenticated session & verified tenant context
router.use(authMiddleware, tenantContextMiddleware);

// GET /api/v1/articles - List tenant articles with pagination, filters, sorting
router.get('/', articleController.list);

// POST /api/v1/articles - Create article (OWNER, ADMIN, EDITOR)
router.post('/', validateBody(createArticleSchema), articleController.create);

// GET /api/v1/articles/:articleId - Get article detail
router.get('/:articleId', articleController.getById);

// PATCH /api/v1/articles/:articleId - Update article
router.patch('/:articleId', validateBody(updateArticleSchema), articleController.update);

// POST /api/v1/articles/:articleId/publish - Publish article (OWNER, ADMIN)
router.post(
  '/:articleId/publish',
  roleMiddleware(['OWNER', 'ADMIN']),
  articleController.publish
);

// DELETE /api/v1/articles/:articleId - Archive or delete article (OWNER, ADMIN)
router.delete(
  '/:articleId',
  roleMiddleware(['OWNER', 'ADMIN']),
  articleController.delete
);

module.exports = router;
