import request from 'supertest';
import app from '../src/app.js';

describe('API auth guards (integration)', () => {
  test('GET /api/auth/me returns 401 without token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'NO_TOKEN' });
  });

  test('GET /api/financial-intelligence/summary returns 401 without token', async () => {
    const response = await request(app).get('/api/financial-intelligence/summary');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'NO_TOKEN' });
  });

  test('GET /api/demographic-social/summary returns 401 without token', async () => {
    const response = await request(app).get('/api/demographic-social/summary');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'NO_TOKEN' });
  });

  test('GET /api/operational-algorithms/zone-prioritization returns 401 without token', async () => {
    const response = await request(app).get('/api/operational-algorithms/zone-prioritization');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'NO_TOKEN' });
  });

  test('GET /api/financial-intelligence/summary returns 401 with malformed token', async () => {
    const response = await request(app)
      .get('/api/financial-intelligence/summary')
      .set('Authorization', 'Bearer token-malformado');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'INVALID_TOKEN' });
  });
});
