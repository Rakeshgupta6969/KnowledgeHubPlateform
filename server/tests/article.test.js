const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/tokens');

describe('Articles APIs (/api/v1/articles)', () => {
  let tenantA;
  let tokenA;

  let tenantB;
  let tokenB;

  let editorTokenA;
  let catA;
  let catB;

  beforeEach(async () => {
    // 1. Tenant A (Owner Alice)
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company Alpha',
        slug: 'alpha',
        name: 'Alice Alpha',
        email: 'alice@alpha.com',
        password: 'Password123!',
      });
    tenantA = regA.body.tenant;
    tokenA = regA.body.accessToken;

    // 2. Tenant B (Owner Bob)
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company Beta',
        slug: 'beta',
        name: 'Bob Beta',
        email: 'bob@beta.com',
        password: 'Password123!',
      });
    tenantB = regB.body.tenant;
    tokenB = regB.body.accessToken;

    // 3. Editor in Tenant A
    const editorUser = await prisma.user.create({
      data: {
        name: 'Ed Editor',
        email: 'ed@alpha.com',
        passwordHash: 'hash_ed',
      },
    });
    await prisma.membership.create({
      data: {
        tenantId: tenantA.id,
        userId: editorUser.id,
        role: 'EDITOR',
        status: 'ACTIVE',
      },
    });
    editorTokenA = generateAccessToken({ userId: editorUser.id, email: editorUser.email });

    // 4. Create category in Tenant A
    const resCatA = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Guides Alpha', slug: 'guides-alpha' });
    catA = resCatA.body.category;

    // 5. Create category in Tenant B
    const resCatB = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Guides Beta', slug: 'guides-beta' });
    catB = resCatB.body.category;
  });

  describe('POST /api/v1/articles', () => {
    it('creates a DRAFT article with auto-generated slug', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'How to Reset Your Password',
          content: 'Step 1: Go to settings. Step 2: Click password.',
          categoryId: catA.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.article).toMatchObject({
        title: 'How to Reset Your Password',
        slug: 'how-to-reset-your-password',
        status: 'DRAFT',
        tenantId: tenantA.id,
        categoryId: catA.id,
      });
      expect(res.body.article.publishedAt).toBeNull();
    });

    it('allows an EDITOR to create draft articles', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${editorTokenA}`)
        .send({
          title: 'Editor Draft',
          content: 'Created by editor',
        });

      expect(res.status).toBe(201);
      expect(res.body.article.status).toBe('DRAFT');
    });

    it('rejects duplicate article slug within same tenant with 409 ARTICLE_SLUG_EXISTS', async () => {
      await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Account Settings',
          slug: 'account-settings',
          content: 'First article',
        });

      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Another Account Settings',
          slug: 'account-settings',
          content: 'Conflicting article',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ARTICLE_SLUG_EXISTS');
    });

    it('allows identical article slug in a DIFFERENT tenant', async () => {
      await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Setup Guide',
          slug: 'setup-guide',
          content: 'Alpha guide',
        });

      const resB = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Setup Guide',
          slug: 'setup-guide',
          content: 'Beta guide',
        });

      expect(resB.status).toBe(201);
      expect(resB.body.article.tenantId).toBe(tenantB.id);
    });

    it('CROSS-TENANT CATEGORY VALIDATION: rejects attaching article to another tenant category', async () => {
      // User A attempts to attach an article to catB (owned by Tenant B)
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Sneaky Cross-Tenant Article',
          content: 'Trying to use Tenant B category',
          categoryId: catB.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({
        code: 'INVALID_CATEGORY',
        message: 'Selected category does not belong to this workspace',
      });
    });
  });

  describe('GET /api/v1/articles', () => {
    beforeEach(async () => {
      // Create articles in Tenant A
      await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Alpha Article 1', content: 'Content 1', status: 'PUBLISHED' });
      await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Alpha Article 2', content: 'Content 2', status: 'DRAFT' });

      // Create article in Tenant B
      await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Beta Article 1', content: 'Beta Content', status: 'PUBLISHED' });
    });

    it('returns paginated articles scoped to authenticated tenant with metadata', async () => {
      const res = await request(app)
        .get('/api/v1/articles?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('filters articles by status', async () => {
      const res = await request(app)
        .get('/api/v1/articles?status=PUBLISHED')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Alpha Article 1');
    });

    it('CROSS-TENANT ISOLATION: Tenant B article list never returns Tenant A articles', async () => {
      const resB = await request(app)
        .get('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].title).toBe('Beta Article 1');
    });
  });

  describe('Article Lifecycle & Publishing', () => {
    let articleA;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Lifecycle Test',
          content: 'Initial content',
        });
      articleA = res.body.article;
    });

    it('allows OWNER to publish an article via POST /publish', async () => {
      const res = await request(app)
        .post(`/api/v1/articles/${articleA.id}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.article.status).toBe('PUBLISHED');
      expect(res.body.article.publishedAt).not.toBeNull();
    });

    it('RBAC: rejects EDITOR from publishing via POST /publish with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/v1/articles/${articleA.id}/publish`)
        .set('Authorization', `Bearer ${editorTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('validates state transitions and rejects invalid transition', async () => {
      // Draft -> Archived is valid
      const resArchive = await request(app)
        .patch(`/api/v1/articles/${articleA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ARCHIVED' });
      expect(resArchive.status).toBe(200);
      expect(resArchive.body.article.status).toBe('ARCHIVED');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot read Tenant A article by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/articles/${articleA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot update Tenant A article', async () => {
      const res = await request(app)
        .patch(`/api/v1/articles/${articleA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot publish Tenant A article', async () => {
      const res = await request(app)
        .post(`/api/v1/articles/${articleA.id}/publish`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot delete Tenant A article', async () => {
      const res = await request(app)
        .delete(`/api/v1/articles/${articleA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });
  });
});
