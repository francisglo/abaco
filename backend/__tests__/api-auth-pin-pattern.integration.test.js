import request from 'supertest';
import app from '../src/app.js';

describe('Autenticación avanzada: password, PIN y patrón', () => {
  const userData = {
    name: 'Test User',
    username: 'testuserpinpat',
    email: 'testpinpat@example.com',
    password: 'Test1234!',
    pin: '2580',
    pattern: 'xy12!'
  };

  let token;

  it('permite registrar usuario con password, PIN y patrón', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: userData.username });
  });

  it('permite login con password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userData.username, password: userData.password });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    token = res.body.token;
  });

  it('permite login con PIN', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userData.username, pin: userData.pin });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('permite login con patrón', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userData.username, pattern: userData.pattern });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('rechaza login con PIN incorrecto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userData.username, pin: '9999' });
    expect(res.status).toBe(401);
  });

  it('rechaza login con patrón incorrecto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: userData.username, pattern: 'zzzz' });
    expect(res.status).toBe(401);
  });
});
