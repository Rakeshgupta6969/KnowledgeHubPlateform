const categoryService = require('./category.service');
const auditService = require('../audit/audit.service');

class CategoryController {
  async list(req, res, next) {
    try {
      const categories = await categoryService.listCategories(req.tenant.id, req.query);
      res.status(200).json({ categories });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.tenant.id, req.params.categoryId);
      res.status(200).json({ category });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.tenant.id, req.body);
      res.status(201).json({ category });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(
        req.tenant.id,
        req.params.categoryId,
        req.body
      );
      res.status(200).json({ category });
    } catch (err) {
      next(err);
    }
  }

  async archive(req, res, next) {
    try {
      const category = await categoryService.archiveCategory(req.tenant.id, req.params.categoryId);

      // Record audit event
      await auditService.log(
        req.tenant.id,
        req.user.id,
        'CATEGORY_ARCHIVED',
        'CATEGORY',
        category.id,
        { name: category.name, slug: category.slug }
      );

      res.status(200).json({
        message: 'Category archived successfully',
        category,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
