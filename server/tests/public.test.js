const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Public Help Center APIs (/api/v1/public/:tenantSlug)', () => {
  let tenantA;
  let tokenA;
  let tokenB;

  let catA;

  beforeEach(async () => {
    // 1. Register Tenant A
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Alpha Tech',
        slug: 'alpha-tech',
        name: 'Alice Alpha',
        email: 'alice@alphatech.com',
        password: 'Password123!',
      });
    tenantA = regA.body.tenant;
    tokenA = regA.body.accessToken;

    // 2. Register Tenant B
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Beta Systems',
        slug: 'beta-systems',
        name: 'Bob Beta',
        email: 'bob@betasystems.com',
        password: 'Password123!',
      });
    tokenB = regB.body.accessToken;

    // 3. Create category in Tenant A
    const resCat = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'General Support', slug: 'general-support' });
    catA = resCat.body.category;

    // 4. Create PUBLISHED article in Tenant A
    await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Getting Started with Alpha',
        slug: 'getting-started',
        content: '# Welcome to Alpha\n\nThis is a public guide.',
        status: 'PUBLISHED',
        categoryId: catA.id,
      });

    // 5. Create DRAFT article in Tenant A
    await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Internal Secret Roadmap',
        slug: 'internal-secret-roadmap',
        content: 'This is a private internal draft.',
        status: 'DRAFT',
      });

    // 6. Create ARCHIVED article in Tenant A
    const resArchived = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Deprecated Feature Guide',
        slug: 'deprecated-feature',
        content: 'Old instructions.',
      });
    await request(app)
      .patch(`/api/v1/articles/${resArchived.body.article.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'ARCHIVED' });

    // 7. Create PUBLISHED article in Tenant B
    await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Beta Systems Knowledge',
        slug: 'beta-guide',
        content: 'Content for Beta.',
        status: 'PUBLISHED',
      });
  });

  describe('GET /api/v1/public/:tenantSlug', () => {
    it('returns public configuration for an active tenant without authentication', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.tenant).toMatchObject({
        id: tenantA.id,
        name: 'Alpha Tech',
        slug: 'alpha-tech',
        status: 'ACTIVE',
      });
    });

    it('returns 404 TENANT_NOT_FOUND for nonexistent tenant slug', async () => {
      const res = await request(app).get('/api/v1/public/nonexistent-tenant-slug');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TENANT_NOT_FOUND');
    });

    it('returns 404 TENANT_NOT_FOUND for suspended tenant', async () => {
      await prisma.tenant.update({
        where: { id: tenantA.id },
        data: { status: 'SUSPENDED' },
      });

      const res = await request(app).get(`/api/v1/public/${tenantA.slug}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('GET /api/v1/public/:tenantSlug/categories', () => {
    it('returns public categories and counts ONLY published articles', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/categories`);

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0]).toMatchObject({
        slug: 'general-support',
        _count: {
          articles: 1, // Only the 1 PUBLISHED article
        },
      });
    });
  });

  describe('GET /api/v1/public/:tenantSlug/articles', () => {
    it('returns ONLY published articles for the requested tenant', async () => {
      const res = await request(app).get(`/api/v1/public/${tenantA.slug}/articles`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('getting-started');

      // Draft and archived articles must NOT appear
      const returnedSlugs = res.body.data.map((a) => a.slug);
      expect(returnedSlugs).not.toContain('internal-secret-roadmap');
      expect(returnedSlugs).not.toContain('deprecated-feature');
      expect(returnedSlugs).not.toContain('beta-guide'); // Tenant B article
    });

    it('filters published articles by categorySlug', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles?categorySlug=general-support`
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.category.slug).toBe('general-support');
    });

    it('returns 404 CATEGORY_NOT_FOUND if requested categorySlug does not exist in tenant', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles?categorySlug=nonexistent-category`
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('GET /api/v1/public/:tenantSlug/articles/:articleSlug', () => {
    it('returns published article details including content', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/getting-started`
      );

      expect(res.status).toBe(200);
      expect(res.body.article).toMatchObject({
        title: 'Getting Started with Alpha',
        slug: 'getting-started',
        status: 'PUBLISHED',
      });
      expect(res.body.article.content).toContain('Welcome to Alpha');
    });

    it('CRITICAL PRIVACY: returns 404 for DRAFT article', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/internal-secret-roadmap`
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('CRITICAL PRIVACY: returns 404 for ARCHIVED article', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/deprecated-feature`
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('CROSS-TENANT ISOLATION: returns 404 when querying Tenant B article under Tenant A slug', async () => {
      const res = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/beta-guide`
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });
  });
});
