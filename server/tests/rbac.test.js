const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');
const { generateAccessToken } = require('../src/utils/tokens');

describe('RBAC Hardening & Audit Logging (/api/v1/articles, categories, tenant)', () => {
  let tenant;
  let ownerUser, adminUser, editorUser;
  let ownerToken, adminToken, editorToken;
  let editorMembership;
  let testArticle;

  beforeEach(async () => {
    const hash = await bcrypt.hash('Password123!', 10);

    tenant = await prisma.tenant.create({
      data: { name: 'RBAC Corp', slug: 'rbac-corp', status: 'ACTIVE' },
    });

    ownerUser = await prisma.user.create({
      data: { name: 'Owner User', email: 'owner@rbac.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: ownerUser.id, role: 'OWNER' },
    });
    ownerToken = generateAccessToken({ userId: ownerUser.id });

    adminUser = await prisma.user.create({
      data: { name: 'Admin User', email: 'admin@rbac.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: adminUser.id, role: 'ADMIN' },
    });
    adminToken = generateAccessToken({ userId: adminUser.id });

    editorUser = await prisma.user.create({
      data: { name: 'Editor User', email: 'editor@rbac.com', passwordHash: hash },
    });
    editorMembership = await prisma.membership.create({
      data: { tenantId: tenant.id, userId: editorUser.id, role: 'EDITOR' },
    });
    editorToken = generateAccessToken({ userId: editorUser.id });

    testArticle = await prisma.article.create({
      data: {
        tenantId: tenant.id,
        authorId: editorUser.id,
        title: 'Initial Draft Article',
        slug: 'initial-draft-article',
        content: 'Draft content.',
        status: 'DRAFT',
      },
    });
  });

  describe('Article RBAC Hardening', () => {
    it('EDITOR can create DRAFT article successfully', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'New Editor Draft', content: 'Draft text' });

      expect(res.status).toBe(201);
      expect(res.body.article.status).toBe('DRAFT');
    });

    it('EDITOR is rejected with 403 when trying to create article directly with status PUBLISHED', async () => {
      const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Illegally Published Draft',
          content: 'Sneaky publish',
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_AUTHORIZED');
    });

    it('EDITOR is rejected with 403 when trying to update article status to PUBLISHED', async () => {
      const res = await request(app)
        .patch(`/api/v1/articles/${testArticle.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_AUTHORIZED');
    });
  });

  describe('Member Management & RBAC', () => {
    it('allows OWNER to list workspace members', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/members')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(3);
    });

    it('allows OWNER to promote an EDITOR to ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/v1/tenant/members/${editorMembership.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body.member.role).toBe('ADMIN');

      // Verify audit log entry
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          tenantId: tenant.id,
          action: 'MEMBER_ROLE_UPDATED',
        },
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog.actorUserId).toBe(ownerUser.id);
    });

    it('rejects ADMIN trying to modify member roles with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .patch(`/api/v1/tenant/members/${editorMembership.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Administrative Audit Logging', () => {
    it('creates audit log when an article is published and archived', async () => {
      // 1. Publish article
      const pubRes = await request(app)
        .post(`/api/v1/articles/${testArticle.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(pubRes.status).toBe(200);

      // Verify audit log for publish
      const pubLog = await prisma.auditLog.findFirst({
        where: { action: 'ARTICLE_PUBLISHED', resourceId: testArticle.id },
      });
      expect(pubLog).not.toBeNull();
      expect(pubLog.actorUserId).toBe(adminUser.id);

      // 2. Archive article
      const delRes = await request(app)
        .delete(`/api/v1/articles/${testArticle.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(delRes.status).toBe(200);

      // Verify audit log for archive
      const arcLog = await prisma.auditLog.findFirst({
        where: { action: 'ARTICLE_ARCHIVED', resourceId: testArticle.id },
      });
      expect(arcLog).not.toBeNull();
      expect(arcLog.actorUserId).toBe(ownerUser.id);
    });

    it('allows OWNER to view workspace audit log', async () => {
      await request(app)
        .post(`/api/v1/articles/${testArticle.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/v1/tenant/audit-logs')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].action).toBe('ARTICLE_PUBLISHED');
    });

    it('rejects EDITOR trying to view audit logs with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/audit-logs')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
