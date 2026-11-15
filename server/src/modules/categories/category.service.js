const prisma = require('../../config/prisma');
const ApiError = require('../../utils/errors');
const slugify = require('../../utils/slugify');

class CategoryService {
  async listCategories(tenantId, options = {}) {
    const where = { tenantId };

    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return categories;
  }

  async getCategoryById(tenantId, categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category || category.tenantId !== tenantId) {
      throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  async createCategory(tenantId, data) {
    const rawSlug = data.slug && data.slug.trim() ? data.slug.trim() : slugify(data.name);
    const slug = rawSlug || 'category';

    // Verify slug uniqueness within tenant
    const existing = await prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict(
        'A category with this slug already exists in this workspace',
        'CATEGORY_SLUG_EXISTS'
      );
    }

    const category = await prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        slug,
        description: data.description || null,
        sortOrder: data.sortOrder ?? 0,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return category;
  }

  async updateCategory(tenantId, categoryId, data) {
    const existing = await this.getCategoryById(tenantId, categoryId);

    const dataToUpdate = {};
    if (data.name !== undefined) dataToUpdate.name = data.name;
    if (data.description !== undefined) dataToUpdate.description = data.description;
    if (data.sortOrder !== undefined) dataToUpdate.sortOrder = data.sortOrder;
    if (data.status !== undefined) dataToUpdate.status = data.status;

    if (data.slug !== undefined) {
      const slug = slugify(data.slug);
      if (slug !== existing.slug) {
        const slugConflict = await prisma.category.findUnique({
          where: {
            tenantId_slug: {
              tenantId,
              slug,
            },
          },
        });
        if (slugConflict) {
          throw ApiError.conflict(
            'A category with this slug already exists in this workspace',
            'CATEGORY_SLUG_EXISTS'
          );
        }
        dataToUpdate.slug = slug;
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: dataToUpdate,
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return updated;
  }

  async archiveCategory(tenantId, categoryId) {
    // Verifies tenant ownership
    await this.getCategoryById(tenantId, categoryId);

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { status: 'ARCHIVED' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return updated;
  }
}

module.exports = new CategoryService();
