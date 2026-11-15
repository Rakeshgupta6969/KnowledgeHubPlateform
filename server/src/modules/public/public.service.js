const prisma = require('../../config/prisma');
const ApiError = require('../../utils/errors');

class PublicService {
  async getPublicTenant(tenantSlug) {
    if (!tenantSlug) {
      throw ApiError.badRequest('Tenant slug is required', 'SLUG_REQUIRED');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        status: true,
      },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw ApiError.notFound('Help Center not found', 'TENANT_NOT_FOUND');
    }

    return tenant;
  }

  async getPublicCategories(tenantSlug) {
    const tenant = await this.getPublicTenant(tenantSlug);

    const categories = await prisma.category.findMany({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        _count: {
          select: {
            articles: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    return {
      tenant,
      categories,
    };
  }

  async getPublicArticles(tenantSlug, query = {}) {
    const tenant = await this.getPublicTenant(tenantSlug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {
      tenantId: tenant.id,
      status: 'PUBLISHED', // CRITICAL: Only PUBLISHED articles are visible publicly
    };

    let activeCategory = null;
    if (query.categorySlug) {
      activeCategory = await prisma.category.findUnique({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: query.categorySlug.toLowerCase(),
          },
        },
      });

      if (!activeCategory || activeCategory.status !== 'ACTIVE') {
        throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      }

      where.categoryId = activeCategory.id;
    }

    const [total, articles] = await prisma.$transaction([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          author: {
            select: { name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tenant,
      category: activeCategory
        ? {
            id: activeCategory.id,
            name: activeCategory.name,
            slug: activeCategory.slug,
            description: activeCategory.description,
          }
        : null,
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getPublicArticleBySlug(tenantSlug, articleSlug) {
    const tenant = await this.getPublicTenant(tenantSlug);

    if (!articleSlug) {
      throw ApiError.badRequest('Article slug is required', 'SLUG_REQUIRED');
    }

    const article = await prisma.article.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: articleSlug.toLowerCase(),
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true, description: true },
        },
        author: {
          select: { name: true },
        },
      },
    });

    // CRITICAL: Draft or Archived articles must return 404 to public visitors
    if (!article || article.status !== 'PUBLISHED') {
      throw ApiError.notFound('Article not found', 'ARTICLE_NOT_FOUND');
    }

    return {
      tenant,
      article,
    };
  }
}

module.exports = new PublicService();
