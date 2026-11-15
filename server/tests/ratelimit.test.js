const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Rate Limiting Enforcement (Login, Search, Feedback)', () => {
  let tenant;
  let user;
  let article;

  beforeEach(async () => {
    tenant = await prisma.tenant.create({
      data: { name: 'RateLimit Corp', slug: 'ratelimit-corp', status: 'ACTIVE' },
    });

    const hash = await bcrypt.hash('Password123!', 10);
    user = await prisma.user.create({
      data: { name: 'Rate Limit User', email: 'ratelimit@corp.com', passwordHash: hash },
    });
    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: user.id, role: 'OWNER' },
    });

    article = await prisma.article.create({
      data: {
        tenantId: tenant.id,
        authorId: user.id,
        title: 'Rate Limit Testing Guide',
        slug: 'rate-limit-guide',
        content: 'Content about rate limits.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  });

  it('enforces rate limiting on POST /api/v1/auth/login after 10 requests', async () => {
    // 10 allowed attempts
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('x-test-rate-limit', 'true')
        .set('x-forwarded-for', '198.51.100.1')
        .send({ email: 'ratelimit@corp.com', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    }

    // 11th request trips rate limit
    const throttled = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-rate-limit', 'true')
      .set('x-forwarded-for', '198.51.100.1')
      .send({ email: 'ratelimit@corp.com', password: 'Password123!' });

    expect(throttled.status).toBe(429);
    expect(throttled.body.error.code).toBe('LOGIN_RATE_LIMIT_EXCEEDED');
  });

  it('enforces rate limiting on GET /api/v1/public/:tenantSlug/search after 30 requests', async () => {
    // 30 allowed searches
    for (let i = 0; i < 30; i++) {
      const res = await request(app)
        .get(`/api/v1/public/${tenant.slug}/search?q=test`)
        .set('x-test-rate-limit', 'true')
        .set('x-forwarded-for', '198.51.100.2');
      expect(res.status).toBe(200);
    }

    // 31st search trips rate limit
    const throttled = await request(app)
      .get(`/api/v1/public/${tenant.slug}/search?q=test`)
      .set('x-test-rate-limit', 'true')
      .set('x-forwarded-for', '198.51.100.2');

    expect(throttled.status).toBe(429);
    expect(throttled.body.error.code).toBe('SEARCH_RATE_LIMIT_EXCEEDED');
  });

  it('enforces rate limiting on POST feedback after 15 requests', async () => {
    // 15 allowed attempts (with unique IP or payload to test rate limiter)
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post(`/api/v1/public/${tenant.slug}/articles/${article.slug}/feedback`)
        .set('x-test-rate-limit', 'true')
        .set('x-forwarded-for', '198.51.100.3')
        .send({ helpful: true });
      // Can be 201 or 429 from internal duplicate filter, but middleware level counts
      expect([201, 429]).toContain(res.status);
    }

    // 16th attempt trips express rate limiter
    const throttled = await request(app)
      .post(`/api/v1/public/${tenant.slug}/articles/${article.slug}/feedback`)
      .set('x-test-rate-limit', 'true')
      .set('x-forwarded-for', '198.51.100.3')
      .send({ helpful: true });

    expect(throttled.status).toBe(429);
    expect(throttled.body.error.code).toBe('FEEDBACK_RATE_LIMIT_EXCEEDED');
  });
});
