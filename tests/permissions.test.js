const request = require('supertest');
const { createApp } = require('../src/app');
const { initializeDatabase } = require('../src/db/schema');
const { seedDatabase } = require('../src/db/seed');
const { closeDatabase } = require('../src/utils/db');

let app;
let employee1Token;
let employee2Token;
let managerToken;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  initializeDatabase();
  seedDatabase();
  app = createApp();

  // Create second employee
  await request(app)
    .post('/auth/register')
    .send({
      email: 'employee2@example.com',
      password: 'password123',
      name: 'Employee Two'
    });

  // Login as employee 1
  const emp1Res = await request(app)
    .post('/auth/login')
    .send({ email: 'employee@example.com', password: 'password123' });
  employee1Token = emp1Res.body.access_token;

  // Login as employee 2
  const emp2Res = await request(app)
    .post('/auth/login')
    .send({ email: 'employee2@example.com', password: 'password123' });
  employee2Token = emp2Res.body.access_token;

  // Login as manager
  const mgrRes = await request(app)
    .post('/auth/login')
    .send({ email: 'manager@example.com', password: 'password123' });
  managerToken = mgrRes.body.access_token;
});

afterAll(() => {
  closeDatabase();
});

describe('Permission Tests', () => {
  let employee1ExpenseId;

  beforeAll(async () => {
    // Create expense as employee 1
    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({
        category_id: 2,
        amount: 100.00,
        description: 'Employee 1 expense',
        receipt_date: '2024-01-15'
      });
    employee1ExpenseId = res.body.id;
  });

  test('employee should only see own expenses', async () => {
    const res = await request(app)
      .get('/expenses')
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every(e => e.user_name === 'Employee User')).toBe(true);
  });

  test('manager should see all expenses', async () => {
    // Create expense as employee 2
    await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employee2Token}`)
      .send({
        category_id: 2,
        amount: 50.00,
        description: 'Employee 2 expense',
        receipt_date: '2024-01-15'
      });

    const res = await request(app)
      .get('/expenses')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(1);
  });

  test('employee should not view other employee expense', async () => {
    const res = await request(app)
      .get(`/expenses/${employee1ExpenseId}`)
      .set('Authorization', `Bearer ${employee2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  test('manager should view any expense', async () => {
    const res = await request(app)
      .get(`/expenses/${employee1ExpenseId}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(employee1ExpenseId);
  });

  test('employee should not update other employee expense', async () => {
    const res = await request(app)
      .put(`/expenses/${employee1ExpenseId}`)
      .set('Authorization', `Bearer ${employee2Token}`)
      .send({
        category_id: 3,
        amount: 200.00,
        description: 'Hacked',
        receipt_date: '2024-01-15'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  test('employee should not delete other employee expense', async () => {
    const res = await request(app)
      .delete(`/expenses/${employee1ExpenseId}`)
      .set('Authorization', `Bearer ${employee2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  test('employee should not create categories', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${employee1Token}`)
      .send({ name: 'New Category' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Manager');
  });

  test('manager should create categories', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Equipment' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Equipment');
  });

  test('employee should not delete categories', async () => {
    const res = await request(app)
      .delete('/categories/2')
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Manager');
  });

  test('should not delete system category', async () => {
    const res = await request(app)
      .delete('/categories/1')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('system');
  });

  test('employee should not access by-user reports', async () => {
    const res = await request(app)
      .get('/reports/by-user')
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Manager');
  });

  test('manager should access by-user reports', async () => {
    const res = await request(app)
      .get('/reports/by-user')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
  });

  test('employee should see only own data in summary report', async () => {
    const res = await request(app)
      .get('/reports/summary?from_date=2024-01-01&to_date=2024-12-31')
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    // Should only include employee 1's expense
    expect(res.body.grand_total).toBe(100.00);
  });

  test('manager should see all data in summary report', async () => {
    const res = await request(app)
      .get('/reports/summary?from_date=2024-01-01&to_date=2024-12-31')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    // Should include all expenses
    expect(res.body.grand_total).toBeGreaterThan(100.00);
  });
});
