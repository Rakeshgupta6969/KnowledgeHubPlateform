const prisma = require('../../config/prisma');
const cache = require('../../config/redis');
const ApiError = require('../../utils/errors');
const slugify = require('../../utils/slugify');

class ArticleService {
  async listArticles(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = { tenantId };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search && query.search.trim()) {
      where.title = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    // Predictable sorting
    let orderBy = { createdAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      const validFields = ['createdAt', 'updatedAt', 'publishedAt', 'title'];
      const validDirections = ['asc', 'desc'];
      if (validFields.includes(field) && validDirections.includes(direction)) {
        orderBy = { [field]: direction };
      }
    }

    const [total, articles] = await prisma.$transaction([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getArticleById(tenantId, articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!article || article.tenantId !== tenantId) {
      throw ApiError.notFound('Article not found', 'ARTICLE_NOT_FOUND');
    }

    return article;
  }

  async createArticle(tenantId, authorId, data) {
    // Parent-child tenant ownership check for categoryId
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || category.tenantId !== tenantId) {
        throw ApiError.badRequest(
          'Selected category does not belong to this workspace',
          'INVALID_CATEGORY'
        );
      }
    }

    // Slug generation and uniqueness check
    const rawSlug = data.slug && data.slug.trim() ? data.slug.trim() : slugify(data.title);
    const slug = rawSlug || 'article';

    const existingSlug = await prisma.article.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existingSlug) {
      throw ApiError.conflict(
        'An article with this slug already exists in this workspace',
        'ARTICLE_SLUG_EXISTS'
      );
    }

    const isPublished = data.status === 'PUBLISHED';
    const publishedAt = isPublished ? new Date() : null;

    const article = await prisma.article.create({
      data: {
        tenantId,
        authorId,
        categoryId: data.categoryId || null,
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        status: data.status || 'DRAFT',
        publishedAt,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.invalidateTenantArticle(tenantId, article.slug);
    return article;
  }

  async updateArticle(tenantId, articleId, data) {
    const existing = await this.getArticleById(tenantId, articleId);

    const dataToUpdate = {};
    if (data.title !== undefined) dataToUpdate.title = data.title;
    if (data.excerpt !== undefined) dataToUpdate.excerpt = data.excerpt;
    if (data.content !== undefined) dataToUpdate.content = data.content;

    // Validate category ownership if categoryId is updated
    if (data.categoryId !== undefined) {
      if (data.categoryId !== null) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        });
        if (!category || category.tenantId !== tenantId) {
          throw ApiError.badRequest(
            'Selected category does not belong to this workspace',
            'INVALID_CATEGORY'
          );
        }
      }
      dataToUpdate.categoryId = data.categoryId;
    }

    // Slug update & conflict check
    if (data.slug !== undefined) {
      const slug = slugify(data.slug);
      if (slug !== existing.slug) {
        const slugConflict = await prisma.article.findUnique({
          where: {
            tenantId_slug: {
              tenantId,
              slug,
            },
          },
        });
        if (slugConflict) {
          throw ApiError.conflict(
            'An article with this slug already exists in this workspace',
            'ARTICLE_SLUG_EXISTS'
          );
        }
        dataToUpdate.slug = slug;
      }
    }

    // Status transition validation
    if (data.status !== undefined && data.status !== existing.status) {
      this.validateStatusTransition(existing.status, data.status);
      dataToUpdate.status = data.status;

      if (data.status === 'PUBLISHED') {
        dataToUpdate.publishedAt = existing.publishedAt || new Date();
      } else if (data.status === 'DRAFT' && existing.status === 'PUBLISHED') {
        dataToUpdate.publishedAt = null;
      }
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: dataToUpdate,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.invalidateTenantArticle(tenantId, updated.slug);
    if (existing.slug !== updated.slug) {
      await this.invalidateTenantArticle(tenantId, existing.slug);
    }
    return updated;
  }

  validateStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      DRAFT: ['PUBLISHED', 'ARCHIVED'],
      PUBLISHED: ['DRAFT', 'ARCHIVED'],
      ARCHIVED: ['DRAFT', 'PUBLISHED'],
    };

    if (!validTransitions[fromStatus] || !validTransitions[fromStatus].includes(toStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
        'INVALID_STATUS_TRANSITION'
      );
    }
  }

  async publishArticle(tenantId, articleId) {
    const existing = await this.getArticleById(tenantId, articleId);

    if (existing.status === 'PUBLISHED') {
      return existing;
    }

    this.validateStatusTransition(existing.status, 'PUBLISHED');

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.invalidateTenantArticle(tenantId, updated.slug);
    if (existing.slug !== updated.slug) {
      await this.invalidateTenantArticle(tenantId, existing.slug);
    }
    return updated;
  }

  async deleteArticle(tenantId, articleId, permanent = false) {
    const existing = await this.getArticleById(tenantId, articleId);

    if (permanent) {
      await prisma.article.delete({ where: { id: articleId } });
      await this.invalidateTenantArticle(tenantId, existing.slug);
      return { message: 'Article permanently deleted' };
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { status: 'ARCHIVED' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.invalidateTenantArticle(tenantId, existing.slug);
    return { message: 'Article archived successfully', article: updated };
  }

  async invalidateTenantArticle(tenantId, articleSlug) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true },
      });
      if (tenant?.slug) {
        await cache.invalidateArticle(tenant.slug, articleSlug);
      }
    } catch (err) {
      console.warn('Failed to invalidate article cache:', err.message);
    }
  }
}

module.exports = new ArticleService();
