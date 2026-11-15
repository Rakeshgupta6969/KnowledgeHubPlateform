const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const cache = require('../src/config/redis');
const bcrypt = require('bcrypt');
const { generateAccessToken } = require('../src/utils/tokens');

describe('Redis Caching Layer & Invalidation (/api/v1/public & content updates)', () => {
  let tenantA, tenantB;
  let userA, tokenA;
  let catA, pubArticleA;

  beforeEach(async () => {
    // Seed Tenant A
    tenantA = await prisma.tenant.create({
      data: {
        name: 'Cache Acme Corp',
        slug: 'cache-acme',
        status: 'ACTIVE',
      },
    });

    const hash = await bcrypt.hash('Password123!', 10);
    userA = await prisma.user.create({
      data: {
        name: 'Cache Owner',
        email: 'owner@cacheacme.com',
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
    tokenA = generateAccessToken({ userId: userA.id });

    catA = await prisma.category.create({
      data: {
        tenantId: tenantA.id,
        name: 'Support Guides',
        slug: 'support-guides',
      },
    });

    pubArticleA = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        categoryId: catA.id,
        authorId: userA.id,
        title: 'Original Cached Guide',
        slug: 'original-cached-guide',
        content: 'Original cached guide content.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Seed Tenant B
    tenantB = await prisma.tenant.create({
      data: {
        name: 'Cache Globex Corp',
        slug: 'cache-globex',
        status: 'ACTIVE',
      },
    });

    // Clean cache for testing tenants
    await cache.invalidateAllForTenant(tenantA.slug);
    await cache.invalidateAllForTenant(tenantB.slug);
  });

  describe('Cache Writes & Reads', () => {
    it('populates Redis cache on public reads and serves subsequent requests', async () => {
      // 1. Initial read should fetch from DB and populate cache
      const res1 = await request(app).get(`/api/v1/public/${tenantA.slug}`);
      expect(res1.status).toBe(200);
      expect(res1.body.tenant.name).toBe('Cache Acme Corp');

      // Check key exists in cache
      const cachedTenant = await cache.get(cache.keys.tenant(tenantA.slug));
      if (cache.isAvailable()) {
        expect(cachedTenant).not.toBeNull();
        expect(cachedTenant.name).toBe('Cache Acme Corp');
      }

      // 2. Read article
      const artRes1 = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}`
      );
      expect(artRes1.status).toBe(200);
      expect(artRes1.body.article.title).toBe('Original Cached Guide');

      const cachedArticle = await cache.get(
        cache.keys.article(tenantA.slug, pubArticleA.slug)
      );
      if (cache.isAvailable()) {
        expect(cachedArticle).not.toBeNull();
        expect(cachedArticle.article.title).toBe('Original Cached Guide');
      }
    });
  });

  describe('Cache Invalidation on Content Updates', () => {
    it('invalidates article cache when article content is updated', async () => {
      // Prime cache
      await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}`
      );

      // Update article via authenticated private API
      const updateRes = await request(app)
        .patch(`/api/v1/articles/${pubArticleA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated Guide Title' });
      expect(updateRes.status).toBe(200);

      // Verify cached key is cleared or fresh
      if (cache.isAvailable()) {
        const cached = await cache.get(
          cache.keys.article(tenantA.slug, pubArticleA.slug)
        );
        expect(cached).toBeNull();
      }

      // Subsequent public read returns updated data
      const freshRes = await request(app).get(
        `/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}`
      );
      expect(freshRes.status).toBe(200);
      expect(freshRes.body.article.title).toBe('Updated Guide Title');
    });

    it('invalidates categories cache when new category is created', async () => {
      // Prime categories cache
      await request(app).get(`/api/v1/public/${tenantA.slug}/categories`);

      // Create new category
      const createCatRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'New Section' });
      expect(createCatRes.status).toBe(201);

      // Verify cache was invalidated
      if (cache.isAvailable()) {
        const cached = await cache.get(cache.keys.categories(tenantA.slug));
        expect(cached).toBeNull();
      }
    });

    it('invalidates tenant config cache when workspace branding is updated', async () => {
      // Prime tenant cache
      await request(app).get(`/api/v1/public/${tenantA.slug}`);

      // Update branding
      const brandRes = await request(app)
        .patch('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ primaryColor: '#ff0055' });
      expect(brandRes.status).toBe(200);

      // Verify cache was invalidated
      if (cache.isAvailable()) {
        const cached = await cache.get(cache.keys.tenant(tenantA.slug));
        expect(cached).toBeNull();
      }
    });
  });

  describe('Resilient Degradation When Redis Is Down', () => {
    it('app continues to serve public APIs flawlessly when Redis is unavailable', async () => {
      // Spy or simulate isAvailable returning false
      const origIsAvailable = cache.isAvailable;
      cache.isAvailable = () => false;

      try {
        const resTenant = await request(app).get(`/api/v1/public/${tenantA.slug}`);
        expect(resTenant.status).toBe(200);
        expect(resTenant.body.tenant.name).toBe('Cache Acme Corp');

        const resArticle = await request(app).get(
          `/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}`
        );
        expect(resArticle.status).toBe(200);
        expect(resArticle.body.article.title).toBe(pubArticleA.title);

        const resCategories = await request(app).get(
          `/api/v1/public/${tenantA.slug}/categories`
        );
        expect(resCategories.status).toBe(200);
        expect(resCategories.body.categories.length).toBeGreaterThanOrEqual(1);
      } finally {
        // Restore original method
        cache.isAvailable = origIsAvailable;
      }
    });
  });

  describe('Tenant Key Scoping', () => {
    it('never shares cached entries between different tenants', async () => {
      const keyA = cache.keys.tenant(tenantA.slug);
      const keyB = cache.keys.tenant(tenantB.slug);

      expect(keyA).not.toBe(keyB);
      expect(keyA).toContain(tenantA.slug);
      expect(keyB).toContain(tenantB.slug);
    });
  });
});
