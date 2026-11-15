const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Article Feedback APIs (/api/v1/public/:tenantSlug/articles/:articleSlug/feedback)', () => {
  let tenantA, tenantB;
  let userA, userB;
  let pubArticleA, draftArticleA, pubArticleB;

  beforeEach(async () => {
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

    pubArticleA = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        authorId: userA.id,
        title: 'Acme Billing Guide',
        slug: 'billing-guide',
        content: 'This guide explains billing and invoices.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    draftArticleA = await prisma.article.create({
      data: {
        tenantId: tenantA.id,
        authorId: userA.id,
        title: 'Draft Policy',
        slug: 'draft-policy',
        content: 'This is an unpublished draft.',
        status: 'DRAFT',
      },
    });

    pubArticleB = await prisma.article.create({
      data: {
        tenantId: tenantB.id,
        authorId: userB.id,
        title: 'Globex Setup Guide',
        slug: 'setup-guide',
        content: 'Globex account setup steps.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  });

  describe('Happy Path Feedback Submission', () => {
    it('submits helpful rating (true) without comment and saves record', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '192.168.1.10')
        .send({ helpful: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.feedback.helpful).toBe(true);

      const dbRecord = await prisma.feedback.findFirst({
        where: { articleId: pubArticleA.id },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.helpful).toBe(true);
      expect(dbRecord.tenantId).toBe(tenantA.id);
    });

    it('submits unhelpful rating (false) with constructive comment', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '192.168.1.11')
        .send({
          helpful: false,
          comment: 'Step 3 needs more clarification regarding annual plans.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const dbRecord = await prisma.feedback.findFirst({
        where: { articleId: pubArticleA.id, helpful: false },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.comment).toBe('Step 3 needs more clarification regarding annual plans.');
    });
  });

  describe('Validation & Bounds', () => {
    it('rejects missing or non-boolean helpful field with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '192.168.1.12')
        .send({ comment: 'Nice article' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_RATING');
    });

    it('rejects comment exceeding 1000 characters with 400', async () => {
      const longComment = 'x'.repeat(1001);
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '192.168.1.13')
        .send({ helpful: true, comment: longComment });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COMMENT_TOO_LONG');
    });
  });

  describe('Abuse Prevention & Privacy', () => {
    it('blocks rapid consecutive submissions from same IP for same article with 429', async () => {
      // First submission
      const first = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '10.0.0.99')
        .send({ helpful: true });
      expect(first.status).toBe(201);

      // Immediate second submission from same IP
      const second = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleA.slug}/feedback`)
        .set('x-forwarded-for', '10.0.0.99')
        .send({ helpful: true });
      expect(second.status).toBe(429);
      expect(second.body.error.code).toBe('FEEDBACK_ALREADY_SUBMITTED');
    });

    it('returns 404 for nonexistent article slug', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/nonexistent-article/feedback`)
        .send({ helpful: true });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('CRITICAL PRIVACY: returns 404 for DRAFT article', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${draftArticleA.slug}/feedback`)
        .send({ helpful: true });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('CROSS-TENANT ISOLATION: returns 404 when submitting feedback for Tenant B article under Tenant A slug', async () => {
      const res = await request(app)
        .post(`/api/v1/public/${tenantA.slug}/articles/${pubArticleB.slug}/feedback`)
        .send({ helpful: true });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ARTICLE_NOT_FOUND');
    });
  });
});
