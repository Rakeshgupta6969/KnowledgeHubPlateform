const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');
const { generateAccessToken } = require('../src/utils/tokens');

describe('Analytics APIs (/api/v1/analytics & public view recording)', () => {
  let tenantA, tenantB;
  let ownerUserA, editorUserA, ownerUserB;
  let ownerTokenA, editorTokenA, ownerTokenB;
  let pubArticleA1, pubArticleA2, draftArticleA, pubArticleB;

  beforeEach(async () => {
    const hash = await bcrypt.hash('Password123!', 10);

    // Tenant A
    tenantA = await prisma.tenant.create({
      data: { name: 'Acme Corp', slug: 'acme-corp', status: 'ACTIVE' },
    });

    ownerUserA = await prisma.user.create({
      data: { name: 'Acme Owner', email: 'owner@acme.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenantA.id, userId: ownerUserA.id, role: 'OWNER' },
    });
    ownerTokenA = generateAccessToken({ userId: ownerUserA.id });

    editorUserA = await prisma.user.create({
      data: { name: 'Acme Editor', email: 'editor@acme.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenantA.id, userId: editorUserA.id, role: 'EDITOR' },
    });
    editorTokenA = generateAccessToken({ userId: editorUserA.id });

    // Tenant B
    tenantB = await prisma.tenant.create({
      data: { name: 'Globex Corp', slug: 'globex-corp', status: 'ACTIVE' },
    });

    ownerUserB = await prisma.user.create({
      data: { name: 'Globex Owner', email: 'owner@globex.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenantB.id, userId: ownerUserB.id, role: 'OWNER' },
    });
    ownerTokenB = generateAccessToken({ userId: ownerUserB.id });

    // Articles for Tenant A
    pubArticleA1 = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        authorId: ownerUserA.id,
        title: 'Billing Basics',
        slug: 'billing-basics',
        content: 'Billing details.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    pubArticleA2 = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        authorId: ownerUserA.id,
        title: 'Account Settings',
        slug: 'account-settings',
        content: 'Profile configuration.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    draftArticleA = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        authorId: ownerUserA.id,
        title: 'Draft Secret Feature',
        slug: 'draft-feature',
        content: 'Draft content.',
        status: 'DRAFT',
      },
    });

    // Article for Tenant B
    pubArticleB = await prisma.article.create({
      data: {
        tenantId: tenantB.id,
        authorId: ownerUserB.id,
        title: 'Globex Overview',
        slug: 'globex-overview',
        content: 'Globex content.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  });

  describe('Article View Event Collection', () => {
    it('records view event for published article', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA1.slug}/view`)
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .set('x-forwarded-for', '203.0.113.195');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const view = await prisma.articleView.findFirst({
        where: { articleId: pubArticleA1.id },
      });
      expect(view).not.toBeNull();
      expect(view.isBot).toBe(false);
      expect(view.tenantId).toBe(tenantA.id);
    });

    it('flags crawler/bot user-agents with isBot: true', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA1.slug}/view`)
        .set('User-Agent', 'Googlebot/2.1 (+http://www.google.com/bot.html)')
        .set('x-forwarded-for', '66.249.66.1');

      expect(res.status).toBe(200);

      const botView = await prisma.articleView.findFirst({
        where: { articleId: pubArticleA1.id, isBot: true },
      });
      expect(botView).not.toBeNull();
    });

    it('returns 404 for DRAFT article view attempt', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${draftArticleA.slug}/view`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('returns 404 when querying Tenant B article under Tenant A slug', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleB.slug}/view`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/analytics/overview', () => {
    beforeEach(async () => {
      // Seed views for Tenant A
      await prisma.articleView.create({
        data: {
          tenantId: tenantA.id,
          articleId: pubArticleA1.id,
          sessionHash: 'hash1',
          isBot: false,
        },
      });
      await prisma.articleView.create({
        data: {
          tenantId: tenantA.id,
          articleId: pubArticleA2.id,
          sessionHash: 'hash2',
          isBot: false,
        },
      });
      // Bot view (should be excluded)
      await prisma.articleView.create({
        data: {
          tenantId: tenantA.id,
          articleId: pubArticleA1.id,
          sessionHash: 'bot_hash',
          isBot: true,
        },
      });

      // Seed feedback for Tenant A (3 helpful, 1 unhelpful = 75% ratio)
      await prisma.feedback.createMany({
        data: [
          { tenantId: tenantA.id, articleId: pubArticleA1.id, helpful: true },
          { tenantId: tenantA.id, articleId: pubArticleA1.id, helpful: true },
          { tenantId: tenantA.id, articleId: pubArticleA2.id, helpful: true },
          { tenantId: tenantA.id, articleId: pubArticleA2.id, helpful: false },
        ],
      });

      // Seed searches for Tenant A
      await prisma.searchLog.createMany({
        data: [
          { tenantId: tenantA.id, queryText: 'billing', resultsCount: 2 },
          { tenantId: tenantA.id, queryText: 'refunds', resultsCount: 0 },
        ],
      });

      // Seed Tenant B data (must never leak to Tenant A)
      await prisma.articleView.create({
        data: {
          tenantId: tenantB.id,
          articleId: pubArticleB.id,
          sessionHash: 'tenantB_hash',
          isBot: false,
        },
      });
      await prisma.feedback.create({
        data: { tenantId: tenantB.id, articleId: pubArticleB.id, helpful: true },
      });
    });

    it('returns aggregated metrics scoped strictly to authenticated tenant', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${ownerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalViews).toBe(2); // Excludes bot view
      expect(res.body.metrics.totalSearches).toBe(2);
      expect(res.body.metrics.zeroResultSearches).toBe(1);
      expect(res.body.metrics.totalFeedback).toBe(4);
      expect(res.body.metrics.helpfulCount).toBe(3);
      expect(res.body.metrics.unhelpfulCount).toBe(1);
      expect(res.body.metrics.helpfulRatio).toBe(75); // 3 / 4 * 100 = 75%
    });

    it('RBAC: rejects EDITOR with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${editorTokenA}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('CROSS-TENANT ISOLATION: Tenant B sees only Tenant B metrics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${ownerTokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalViews).toBe(1);
      expect(res.body.metrics.totalSearches).toBe(0);
      expect(res.body.metrics.totalFeedback).toBe(1);
      expect(res.body.metrics.helpfulRatio).toBe(100);
    });
  });

  describe('GET /api/v1/analytics/articles', () => {
    it('returns top articles ranked by views', async () => {
      await prisma.articleView.create({
        data: { tenantId: tenantA.id, articleId: pubArticleA1.id, isBot: false },
      });
      await prisma.articleView.create({
        data: { tenantId: tenantA.id, articleId: pubArticleA1.id, isBot: false },
      });
      await prisma.articleView.create({
        data: { tenantId: tenantA.id, articleId: pubArticleA2.id, isBot: false },
      });

      const res = await request(app)
        .get('/api/v1/analytics/articles')
        .set('Authorization', `Bearer ${ownerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].id).toBe(pubArticleA1.id);
      expect(res.body.data[0].viewsCount).toBe(2);
      expect(res.body.data[1].id).toBe(pubArticleA2.id);
      expect(res.body.data[1].viewsCount).toBe(1);
    });
  });

  describe('GET /api/v1/analytics/searches', () => {
    it('returns popular search terms and zero-result queries', async () => {
      await prisma.searchLog.createMany({
        data: [
          { tenantId: tenantA.id, queryText: 'invoice download', resultsCount: 3 },
          { tenantId: tenantA.id, queryText: 'invoice download', resultsCount: 3 },
          { tenantId: tenantA.id, queryText: 'missing feature x', resultsCount: 0 },
        ],
      });

      const res = await request(app)
        .get('/api/v1/analytics/searches')
        .set('Authorization', `Bearer ${ownerTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.popularSearches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            query: 'invoice download',
            count: 2,
            avgResults: 3,
          }),
        ])
      );
      expect(res.body.noResultSearches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            query: 'missing feature x',
            count: 1,
          }),
        ])
      );
    });
  });
});
