const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Auth APIs (/api/v1/auth)', () => {
  describe('POST /api/v1/auth/register', () => {
    it('creates a user, tenant, and owner membership in ONE atomic transaction', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Stark Industries',
          slug: 'stark',
          name: 'Tony Stark',
          email: 'tony@stark.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toMatchObject({
        name: 'Tony Stark',
        email: 'tony@stark.com',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');

      expect(res.body).toHaveProperty('tenant');
      expect(res.body.tenant).toMatchObject({
        name: 'Stark Industries',
        slug: 'stark',
      });

      expect(res.body).toHaveProperty('membership');
      expect(res.body.membership.role).toBe('OWNER');
      expect(res.body.membership.status).toBe('ACTIVE');

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');

      // Verify HttpOnly cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);

      // Verify database consistency
      const user = await prisma.user.findUnique({
        where: { email: 'tony@stark.com' },
        include: { memberships: true },
      });
      expect(user).toBeDefined();
      expect(user.memberships.length).toBe(1);
      expect(user.memberships[0].tenantId).toBe(res.body.tenant.id);
      expect(user.memberships[0].role).toBe('OWNER');
    });

    it('rejects duplicate email with 409 EMAIL_ALREADY_EXISTS', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company One',
          slug: 'co-one',
          name: 'User One',
          email: 'duplicate@test.com',
          password: 'Password123!',
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company Two',
          slug: 'co-two',
          name: 'User Two',
          email: 'duplicate@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    });

    it('rejects duplicate slug with 409 SLUG_ALREADY_EXISTS', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company One',
          slug: 'shared-slug',
          name: 'User One',
          email: 'user1@test.com',
          password: 'Password123!',
        });

      // Second registration with same slug
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company Two',
          slug: 'shared-slug',
          name: 'User Two',
          email: 'user2@test.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'Company slug is already taken',
      });
    });

    it('validates request body via Zod and rejects short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Co',
          name: 'U',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Wayne Enterprises',
          slug: 'wayne',
          name: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          password: 'Password123!',
        });
    });

    it('authenticates valid credentials, returns tokens and memberships', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bruce@wayne.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        name: 'Bruce Wayne',
        email: 'bruce@wayne.com',
      });
      expect(res.body.memberships.length).toBe(1);
      expect(res.body.memberships[0].tenant.slug).toBe('wayne');

      const cookies = res.headers['set-cookie'];
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('returns generic error for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bruce@wayne.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('returns generic error for non-existent email to prevent user enumeration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@wayne.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('returns generic error for suspended user', async () => {
      await prisma.user.update({
        where: { email: 'bruce@wayne.com' },
        data: { status: 'SUSPENDED' },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bruce@wayne.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });

  describe('Refresh & Logout Sessions', () => {
    let loginCookie;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Cyberdyne Systems',
          slug: 'cyberdyne',
          name: 'Miles Dyson',
          email: 'miles@cyberdyne.com',
          password: 'Password123!',
        });
      loginCookie = reg.headers['set-cookie'];
    });

    it('POST /refresh issues a new access token using a valid cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', loginCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('POST /refresh fails with 401 when no cookie is sent', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REFRESH_TOKEN_REQUIRED');
    });

    it('POST /logout revokes the session and subsequent /refresh fails', async () => {
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', loginCookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe('Logged out successfully');

      // Attempt to refresh after logout
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', loginCookie);

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REQUIRED');
    });

    it('returns current user details and memberships when authenticated', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Ollivanders',
          slug: 'ollivanders',
          name: 'Garrick Ollivander',
          email: 'garrick@wands.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${reg.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        name: 'Garrick Ollivander',
        email: 'garrick@wands.com',
        status: 'ACTIVE',
      });
      expect(res.body.memberships.length).toBe(1);
      expect(res.body.memberships[0].tenant.slug).toBe('ollivanders');
    });
  });
});
