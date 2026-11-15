const prisma = require('../../config/prisma');

class AnalyticsService {
  parseDateRange(from, to) {
    const toDate = to ? new Date(to) : new Date();
    // Default fromDate to 30 days ago if omitted
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return { fromDate, toDate };
  }

  async getOverview(tenantId, query = {}) {
    const { fromDate, toDate } = this.parseDateRange(query.from, query.to);

    const [viewsCount, feedbackStats, totalSearches, zeroResultSearches] =
      await Promise.all([
        // Non-bot article views within date range
        prisma.articleView.count({
          where: {
            tenantId,
            isBot: false,
            viewedAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
        }),

        // Feedback breakdown within date range
        prisma.feedback.groupBy({
          by: ['helpful'],
          where: {
            tenantId,
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
          _count: {
            _all: true,
          },
        }),

        // Total searches within date range
        prisma.searchLog.count({
          where: {
            tenantId,
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
        }),

        // Zero-result searches within date range
        prisma.searchLog.count({
          where: {
            tenantId,
            resultsCount: 0,
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
        }),
      ]);

    let helpfulCount = 0;
    let unhelpfulCount = 0;
    for (const stat of feedbackStats) {
      if (stat.helpful) {
        helpfulCount += stat._count._all;
      } else {
        unhelpfulCount += stat._count._all;
      }
    }
    const totalFeedback = helpfulCount + unhelpfulCount;
    const helpfulRatio =
      totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : null;

    return {
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      metrics: {
        totalViews: viewsCount,
        totalSearches,
        zeroResultSearches,
        totalFeedback,
        helpfulCount,
        unhelpfulCount,
        helpfulRatio, // Percentage (0-100) or null if no feedback
      },
    };
  }

  async getTopArticles(tenantId, query = {}) {
    const { fromDate, toDate } = this.parseDateRange(query.from, query.to);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));

    // Raw SQL for performant multi-table tenant-scoped aggregation
    const rows = await prisma.$queryRaw`
      SELECT a.id,
             a.title,
             a.slug,
             a.status,
             COUNT(DISTINCT v.id)::int AS "viewsCount",
             COUNT(DISTINCT f.id)::int AS "feedbackCount",
             COUNT(DISTINCT CASE WHEN f.helpful = true THEN f.id END)::int AS "helpfulCount",
             COUNT(DISTINCT CASE WHEN f.helpful = false THEN f.id END)::int AS "unhelpfulCount"
      FROM articles a
      LEFT JOIN article_views v
        ON a.id = v.article_id
       AND v.is_bot = false
       AND v.viewed_at >= ${fromDate}
       AND v.viewed_at <= ${toDate}
      LEFT JOIN feedback f
        ON a.id = f.article_id
       AND f.created_at >= ${fromDate}
       AND f.created_at <= ${toDate}
      WHERE a.tenant_id = ${tenantId}::uuid
      GROUP BY a.id, a.title, a.slug, a.status
      ORDER BY "viewsCount" DESC, "feedbackCount" DESC, a.title ASC
      LIMIT ${limit}
    `;

    const articles = rows.map((r) => {
      const feedbackCount = Number(r.feedbackCount);
      const helpfulCount = Number(r.helpfulCount);
      const unhelpfulCount = Number(r.unhelpfulCount);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status,
        viewsCount: Number(r.viewsCount),
        feedbackCount,
        helpfulCount,
        unhelpfulCount,
        helpfulRatio:
          feedbackCount > 0 ? Math.round((helpfulCount / feedbackCount) * 100) : null,
      };
    });

    return {
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      data: articles,
    };
  }

  async getSearches(tenantId, query = {}) {
    const { fromDate, toDate } = this.parseDateRange(query.from, query.to);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));

    const [popularSearches, noResultSearches] = await Promise.all([
      prisma.$queryRaw`
        SELECT query_text AS "query",
               COUNT(*)::int AS "count",
               ROUND(AVG(results_count), 1)::float AS "avgResults",
               MAX(created_at) AS "lastSearchedAt"
        FROM search_logs
        WHERE tenant_id = ${tenantId}::uuid
          AND created_at >= ${fromDate}
          AND created_at <= ${toDate}
        GROUP BY query_text
        ORDER BY "count" DESC, "lastSearchedAt" DESC
        LIMIT ${limit}
      `,

      prisma.$queryRaw`
        SELECT query_text AS "query",
               COUNT(*)::int AS "count",
               MAX(created_at) AS "lastSearchedAt"
        FROM search_logs
        WHERE tenant_id = ${tenantId}::uuid
          AND results_count = 0
          AND created_at >= ${fromDate}
          AND created_at <= ${toDate}
        GROUP BY query_text
        ORDER BY "count" DESC, "lastSearchedAt" DESC
        LIMIT ${limit}
      `,
    ]);

    return {
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      popularSearches: popularSearches.map((s) => ({
        query: s.query,
        count: Number(s.count),
        avgResults: s.avgResults !== null ? Number(s.avgResults) : 0,
        lastSearchedAt: s.lastSearchedAt,
      })),
      noResultSearches: noResultSearches.map((s) => ({
        query: s.query,
        count: Number(s.count),
        lastSearchedAt: s.lastSearchedAt,
      })),
    };
  }
}

module.exports = new AnalyticsService();
