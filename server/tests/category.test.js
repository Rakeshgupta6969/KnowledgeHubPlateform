const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { generateAccessToken } = require('../src/utils/tokens');

describe('Categories APIs (/api/v1/categories)', () => {
  let tenantA;
  let tokenA;

  let tenantB;
  let tokenB;

  let editorTokenA;

  beforeEach(async () => {
    // Register Tenant A (Owner)
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

    // Register Tenant B (Owner)
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

    // Create an Editor in Tenant A
    const editorUser = await prisma.user.create({
      data: {
        name: 'Ed Editor',
        email: 'ed@alpha.com',
        passwordHash: 'hashed_password',
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
  });

  describe('POST /api/v1/categories', () => {
    it('creates a category with auto-generated slug', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Getting Started',
          description: 'Basic onboarding guides',
          sortOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.category).toMatchObject({
        name: 'Getting Started',
        slug: 'getting-started',
        description: 'Basic onboarding guides',
        sortOrder: 1,
        status: 'ACTIVE',
        tenantId: tenantA.id,
      });
    });

    it('creates a category with custom slug', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Frequently Asked Questions',
          slug: 'faq',
        });

      expect(res.status).toBe(201);
      expect(res.body.category.slug).toBe('faq');
    });

    it('rejects duplicate slug within same tenant with 409 CATEGORY_SLUG_EXISTS', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Billing', slug: 'billing' });

      const duplicateRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Billing Questions', slug: 'billing' });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('CATEGORY_SLUG_EXISTS');
    });

    it('allows identical category slug in a DIFFERENT tenant', async () => {
      // Create in Tenant A
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'General', slug: 'general' });

      // Create with same slug in Tenant B
      const resB = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'General', slug: 'general' });

      expect(resB.status).toBe(201);
      expect(resB.body.category.tenantId).toBe(tenantB.id);
    });

    it('validates input and rejects short name with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('RBAC: rejects EDITOR with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${editorTokenA}`)
        .send({ name: 'Editor Category' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/categories', () => {
    it('lists categories scoped strictly to authenticated tenant', async () => {
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Alpha Cat 1', sortOrder: 2 });
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Alpha Cat 2', sortOrder: 1 });

      // Tenant B category
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Beta Cat 1', sortOrder: 1 });

      const resA = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.categories).toHaveLength(2);
      expect(resA.body.categories[0].name).toBe('Alpha Cat 2'); // sortOrder: 1
      expect(resA.body.categories[1].name).toBe('Alpha Cat 1'); // sortOrder: 2

      // Verify EDITOR can also list categories
      const resEditor = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${editorTokenA}`);
      expect(resEditor.status).toBe(200);
      expect(resEditor.body.categories).toHaveLength(2);
    });
  });

  describe('PATCH & DELETE /api/v1/categories/:categoryId', () => {
    let catA;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Initial Cat', slug: 'initial-cat', sortOrder: 5 });
      catA = res.body.category;
    });

    it('updates category fields successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Updated Cat', sortOrder: 10 });

      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe('Updated Cat');
      expect(res.body.category.sortOrder).toBe(10);
    });

    it('archives category via DELETE', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.category.status).toBe('ARCHIVED');
    });

    it('RBAC: rejects EDITOR updating category with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${editorTokenA}`)
        .send({ name: 'Hacked Cat' });

      expect(res.status).toBe(403);
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot read Tenant A category by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot update Tenant A category', async () => {
      const res = await request(app)
        .patch(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Cross Tenant Update' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('NEGATIVE CROSS-TENANT: Tenant B cannot archive Tenant A category', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${catA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });
});
