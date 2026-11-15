const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Tenant Context & Isolation APIs (/api/v1/tenant)', () => {
  let tenantA;
  let userA;
  let tokenA;

  let tenantB;
  let tokenB;

  beforeEach(async () => {
    // Register Tenant A
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
    userA = regA.body.user;
    tokenA = regA.body.accessToken;

    // Register Tenant B
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
  });

  describe('GET /api/v1/tenant/current', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/tenant/current');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REQUIRED');
    });

    it('rejects invalid Bearer token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('resolves active tenant from authenticated membership for Tenant A', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.tenant).toMatchObject({
        id: tenantA.id,
        name: 'Company Alpha',
        slug: 'alpha',
        status: 'ACTIVE',
      });
      expect(res.body.membership).toMatchObject({
        role: 'OWNER',
        status: 'ACTIVE',
      });
    });

    it('resolves active tenant from authenticated membership for Tenant B', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.tenant).toMatchObject({
        id: tenantB.id,
        name: 'Company Beta',
        slug: 'beta',
        status: 'ACTIVE',
      });
      expect(res.body.membership).toMatchObject({
        role: 'OWNER',
        status: 'ACTIVE',
      });
    });

    it('CROSS-TENANT ISOLATION: rejects User A attempting to access Tenant B with 403 TENANT_ACCESS_DENIED', async () => {
      // User A tries to spoof Tenant B by passing Tenant B's ID in header
      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantB.id);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({
        code: 'TENANT_ACCESS_DENIED',
        message: 'You do not have access to the requested workspace',
      });
    });

    it('rejects access if tenant status is SUSPENDED with 403 TENANT_INACTIVE', async () => {
      // Suspend Tenant A in DB
      await prisma.tenant.update({
        where: { id: tenantA.id },
        data: { status: 'SUSPENDED' },
      });

      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({
        code: 'TENANT_INACTIVE',
        message: 'This workspace is currently suspended',
      });
    });

    it('allows a user belonging to multiple tenants to switch between verified memberships', async () => {
      // Invite/add User A to Tenant B as EDITOR
      await prisma.membership.create({
        data: {
          tenantId: tenantB.id,
          userId: userA.id,
          role: 'EDITOR',
          status: 'ACTIVE',
        },
      });

      // Default access for User A: resolves Tenant A
      const resDefault = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resDefault.status).toBe(200);
      expect(resDefault.body.tenant.id).toBe(tenantA.id);
      expect(resDefault.body.membership.role).toBe('OWNER');

      // Switched access for User A: passes x-tenant-id for Tenant B
      const resSwitched = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantB.id);
      expect(resSwitched.status).toBe(200);
      expect(resSwitched.body.tenant.id).toBe(tenantB.id);
      expect(resSwitched.body.membership.role).toBe('EDITOR');
    });
  });

  describe('PATCH /api/v1/tenant/current', () => {
    it('allows OWNER to update workspace name and primary color', async () => {
      const res = await request(app)
        .patch('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Company Alpha Renamed',
          primaryColor: '#6366F1',
        });

      expect(res.status).toBe(200);
      expect(res.body.tenant.name).toBe('Company Alpha Renamed');
      expect(res.body.tenant.primaryColor).toBe('#6366F1');
      expect(res.body.tenant.id).toBe(tenantA.id);
    });

    it('rejects EDITOR with 403 FORBIDDEN', async () => {
      // Add editor to Tenant A
      const editorUser = await prisma.user.create({
        data: {
          name: 'Ed Editor',
          email: 'ed@alpha.com',
          passwordHash: 'hash',
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
      const { generateAccessToken } = require('../src/utils/tokens');
      const editorToken = generateAccessToken({ userId: editorUser.id, email: editorUser.email });

      const res = await request(app)
        .patch('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('validates input and rejects empty/short name with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
