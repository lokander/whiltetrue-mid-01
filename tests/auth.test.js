const request = require('supertest');
const { createApp } = require('../src/app');
const { initializeDatabase } = require('../src/db/schema');
const { closeDatabase } = require('../src/utils/db');

let app;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  initializeDatabase();
  app = createApp();
});

afterAll(() => {
  closeDatabase();
});

describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.name).toBe('Test User');
      expect(res.body.role).toBe('employee');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    test('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should fail with short password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'short',
          name: 'Test User'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 characters');
    });

    test('should fail with duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'User One'
        });

      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'User Two'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: 'Login Test'
        });
    });

    test('should login successfully', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.token_type).toBe('bearer');
      expect(res.body.user.email).toBe('login@example.com');
    });

    test('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me', () => {
    let token;

    beforeAll(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'me@example.com',
          password: 'password123',
          name: 'Me Test'
        });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123'
        });

      token = loginRes.body.access_token;
    });

    test('should return current user info', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('me@example.com');
      expect(res.body.name).toBe('Me Test');
    });

    test('should fail without token', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
