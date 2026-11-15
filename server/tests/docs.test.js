const request = require('supertest');
const app = require('../src/app');

describe('API Documentation (/api/v1/docs)', () => {
  it('serves Swagger UI HTML page at /api/v1/docs', async () => {
    const res = await request(app).get('/api/v1/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
    expect(res.text).toContain('KnowledgeHub API Documentation');
  });

  it('serves OpenAPI 3.0 specification at /api/v1/docs/swagger.json', async () => {
    const res = await request(app).get('/api/v1/docs/swagger.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('KnowledgeHub REST API');
    expect(res.body.paths['/auth/register']).toBeDefined();
    expect(res.body.paths['/articles']).toBeDefined();
    expect(res.body.paths['/public/{tenantSlug}/search']).toBeDefined();
  });
});
