const express = require('express');
const categoryController = require('./category.controller');
const authMiddleware = require('../../middleware/auth');
const tenantContextMiddleware = require('../../middleware/tenantContext');
const roleMiddleware = require('../../middleware/rbac');
const { validateBody } = require('../../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('./category.validation');

const router = express.Router();

// All category routes require valid user authentication and verified tenant context
router.use(authMiddleware, tenantContextMiddleware);

// GET /api/v1/categories - List tenant categories (accessible to OWNER, ADMIN, EDITOR)
router.get('/', categoryController.list);

// POST /api/v1/categories - Create category (OWNER, ADMIN)
router.post(
  '/',
  roleMiddleware(['OWNER', 'ADMIN']),
  validateBody(createCategorySchema),
  categoryController.create
);

// GET /api/v1/categories/:categoryId - Get category detail
router.get('/:categoryId', categoryController.getById);

// PATCH /api/v1/categories/:categoryId - Update category (OWNER, ADMIN)
router.patch(
  '/:categoryId',
  roleMiddleware(['OWNER', 'ADMIN']),
  validateBody(updateCategorySchema),
  categoryController.update
);

// DELETE /api/v1/categories/:categoryId - Archive category (OWNER, ADMIN)
router.delete('/:categoryId', roleMiddleware(['OWNER', 'ADMIN']), categoryController.archive);

module.exports = router;
