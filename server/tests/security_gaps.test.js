const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const config = require('../src/config/environment');

describe('Security & Isolation Gaps Pass (Validation, Permissions, Expiry, Multi-Tenancy)', () => {
  let tenantA;
  let userA, editorA;
  let tokenA, tokenB, tokenEditorA;
  let articleA;

  beforeEach(async () => {
    // 1. Create Tenant A with Owner and Editor
    const regA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Tenant Alpha',
        slug: 'tenant-alpha',
        name: 'Alpha Owner',
        email: 'owner@alpha.com',
        password: 'Password123!',
      });
    tenantA = regA.body.tenant;
    userA = regA.body.user;
    tokenA = regA.body.accessToken;

    // Create an Editor in Tenant A
    const editorUser = await prisma.user.create({
      data: {
        name: 'Alpha Editor',
        email: 'editor@alpha.com',
        passwordHash: 'hashed_pw',
      },
    });
    const editorMembership = await prisma.membership.create({
      data: {
        tenantId: tenantA.id,
        userId: editorUser.id,
        role: 'EDITOR',
      },
    });
    editorA = { user: editorUser, membership: editorMembership };
    tokenEditorA = jwt.sign(
      { userId: editorUser.id, email: editorUser.email },
      config.accessTokenSecret,
      { expiresIn: '15m' }
    );

    // Create an Article in Tenant A
    const artRes = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Alpha Internal Secrets',
        content: '# Confidential\nThis is confidential Alpha data.',
        status: 'DRAFT',
      });
    articleA = artRes.body.article;

    // 2. Create Tenant B with Owner
    const regB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Tenant Beta',
        slug: 'tenant-beta',
        name: 'Beta Owner',
        email: 'owner@beta.com',
        password: 'Password123!',
      });
    tokenB = regB.body.accessToken;
  });

  describe('Token Expiry & Cryptographic Signature Verification', () => {
    it('rejects an expired access token with 401 TOKEN_EXPIRED', async () => {
      const expiredToken = jwt.sign(
        { userId: userA.id, email: userA.email },
        config.accessTokenSecret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects a token signed with an invalid secret with 401 INVALID_TOKEN', async () => {
      const forgedToken = jwt.sign(
        { userId: userA.id, email: userA.email },
        'wrong_attacker_secret_key',
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/v1/tenant/current')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects malformed Authorization header formats', async () => {
      const malformedHeaders = [
        'Bearer',
        'Basic dXNlcjpwYXNz',
        'Bearer not-a-valid-jwt-token',
        'Token 12345',
      ];

      for (const authHeader of malformedHeaders) {
        const res = await request(app)
          .get('/api/v1/tenant/current')
          .set('Authorization', authHeader);

        expect(res.status).toBe(401);
        expect(['INVALID_TOKEN', 'TOKEN_REQUIRED']).toContain(res.body.error.code);
      }
    });
  });

  describe('Validation & Boundary Handling', () => {
    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Invalid Co',
          slug: 'invalid-co',
          name: 'Invalid User',
          email: 'not-an-email-address',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Short Pass Co',
          slug: 'short-pass-co',
          name: 'Short Pass User',
          email: 'shortpass@example.com',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects article creation with empty title or empty content', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: '',
          content: 'Some content',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects category creation with single-letter name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects search query exceeding 100 characters with 400 QUERY_TOO_LONG', async () => {
      const longQuery = 'a'.repeat(101);
      const res = await request(app)
        .get(`/api/v1/public/${tenantA.slug}/search?q=${longQuery}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('QUERY_TOO_LONG');
    });
  });

  describe('Permissions & Role Escalation Hardening', () => {
    it('rejects EDITOR attempting to delete an article with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/v1/articles/${articleA.id}`)
        .set('Authorization', `Bearer ${tokenEditorA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects EDITOR attempting to create a category with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenEditorA}`)
        .send({ name: 'Editor New Category' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects EDITOR attempting to view workspace audit logs with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/audit-logs')
        .set('Authorization', `Bearer ${tokenEditorA}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Comprehensive Multi-Tenant Isolation Verification', () => {
    it('Tenant B Owner cannot see Tenant A audit logs', async () => {
      // 1. Publish article in Tenant A to generate audit log
      await request(app)
        .post(`/api/v1/articles/${articleA.id}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      // 2. Query audit logs as Tenant B
      const resB = await request(app)
        .get('/api/v1/tenant/audit-logs')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      // None of the logs belong to Tenant A
      const leakedLogs = resB.body.data.filter((l) => l.tenantId === tenantA.id);
      expect(leakedLogs.length).toBe(0);
    });

    it('Tenant B Owner cannot modify Tenant A member roles (returns 404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/tenant/members/${editorA.membership.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MEMBER_NOT_FOUND');
    });

    it('Tenant B analytics queries never include Tenant A events', async () => {
      // 1. Record a view in Tenant A
      await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${articleA.slug}/publish`);
      
      // Publish article in Tenant A
      await request(app)
        .post(`/api/v1/articles/${articleA.id}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${articleA.slug}/view`);

      // 2. Fetch Tenant B analytics overview
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalViews).toBe(0);
      expect(res.body.metrics.totalFeedback).toBe(0);
      expect(res.body.metrics.totalSearches).toBe(0);
    });
  });
});
