const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Public Search APIs (/api/v1/public/:tenantSlug/search)', () => {
  let tenantA, tenantB;
  let catA1, catA2, catB;
  let userA, userB;
  let pubArticleA1, pubArticleA2, draftArticleA, pubArticleB;

  beforeEach(async () => {
    // Seed Tenant A
    tenantA = await prisma.tenant.create({
      data: {
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: 'ACTIVE',
      },
    });

    const hash = await bcrypt.hash('Password123!', 10);
    userA = await prisma.user.create({
      data: {
        name: 'Acme Owner',
        email: 'owner@acme.com',
        passwordHash: hash,
      },
    });

    await prisma.membership.create({
      data: {
        tenantId: tenantA.id,
        userId: userA.id,
        role: 'OWNER',
      },
    });

    catA1 = await prisma.category.create({
      data: {
        tenantId: tenantA.id,
        name: 'Billing & Payments',
        slug: 'billing-payments',
      },
    });

    catA2 = await prisma.category.create({
      data: {
        tenantId: tenantA.id,
        name: 'Account Settings',
        slug: 'account-settings',
      },
    });

    // Seed Tenant B
    tenantB = await prisma.tenant.create({
      data: {
        name: 'Globex Corp',
        slug: 'globex-corp',
        status: 'ACTIVE',
      },
    });

    userB = await prisma.user.create({
      data: {
        name: 'Globex Owner',
        email: 'owner@globex.com',
        passwordHash: hash,
      },
    });

    await prisma.membership.create({
      data: {
        tenantId: tenantB.id,
        userId: userB.id,
        role: 'OWNER',
      },
    });

    catB = await prisma.category.create({
      data: {
        tenantId: tenantB.id,
        name: 'Billing & Payments',
        slug: 'billing-payments',
      },
    });

    // Articles for Tenant A
    pubArticleA1 = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        categoryId: catA1.id,
        authorId: userA.id,
        title: 'How to update credit card and billing details',
        slug: 'update-credit-card',
        excerpt: 'Instructions for updating payment methods.',
        content: 'Navigate to settings, select payment method, and enter your credit card number.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    pubArticleA2 = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        categoryId: catA2.id,
        authorId: userA.id,
        title: 'Resetting your account password',
        slug: 'reset-password',
        excerpt: 'Steps to reset forgotten password.',
        content: 'Click forgot password on login screen to reset your credentials.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    draftArticleA = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        categoryId: catA1.id,
        authorId: userA.id,
        title: 'Internal draft credit card refund policy',
        slug: 'internal-refund-policy',
        excerpt: 'Confidential refund process.',
        content: 'Strict credit card chargeback internal instructions for administrators.',
        status: 'DRAFT',
      },
    });

    // Article for Tenant B (with identical credit card keywords)
    pubArticleB = await prisma.article.create({
      data: {
        tenantId: tenantB.id,
        categoryId: catB.id,
        authorId: userB.id,
        title: 'Globex credit card payment setup',
        slug: 'globex-payment-setup',
        excerpt: 'Globex customer billing guide.',
        content: 'Globex payment portal credit card configuration details.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  });

  describe('Validation & Bounds', () => {
    it('returns 400 when search query q is missing or empty', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SEARCH_QUERY_REQUIRED');
    });

    it('returns 400 when search query q exceeds 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=${longQuery}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('QUERY_TOO_LONG');
    });

    it('returns 404 for nonexistent tenant slug', async () => {
      const res = await request(app).get('/api/v1/public/nonexistent-tenant/search?q=billing');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TENANT_NOT_FOUND');
    });

    it('returns 404 when filtering by a category slug that does not exist in tenant', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=card&category=non-existent-cat`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('PostgreSQL Full-Text Search Execution', () => {
    it('matches articles by title or content keywords and returns ranked results', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=credit card`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(pubArticleA1.id);
      expect(res.body.data[0].title).toBe(pubArticleA1.title);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.meta.page).toBe(1);

      const res2 = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=password`);
      expect(res2.status).toBe(200);
      expect(res2.body.data[0].id).toBe(pubArticleA2.id);
    });

    it('respects category filter when provided', async () => {
      // Both articles exist, but filter by billing-payments category
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/search?q=card&category=${catA1.slug}`
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(pubArticleA1.id);
      expect(res.body.category.slug).toBe(catA1.slug);
    });

    it('returns empty array when query does not match any published articles', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=cryptocurrency`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });
  });

  describe('Privacy & Cross-Tenant Isolation', () => {
    it('CRITICAL PRIVACY: DRAFT articles are NEVER returned in search results', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=refund`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      const articleIds = res.body.data.map((a) => a.id);
      expect(articleIds).not.toContain(draftArticleA.id);
    });

    it('CROSS-TENANT ISOLATION: Tenant B articles are NEVER returned in Tenant A search', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/search?q=credit card`);
      expect(res.status).toBe(200);
      const articleIds = res.body.data.map((a) => a.id);
      expect(articleIds).toContain(pubArticleA1.id);
      expect(articleIds).not.toContain(pubArticleB.id);
    });
  });
});
