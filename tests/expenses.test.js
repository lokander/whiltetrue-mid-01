const request = require('supertest');
const { createApp } = require('../src/app');
const { initializeDatabase } = require('../src/db/schema');
const { seedDatabase } = require('../src/db/seed');
const { closeDatabase } = require('../src/utils/db');

let app;
let employeeToken;
let managerToken;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  initializeDatabase();
  seedDatabase();
  app = createApp();

  // Login as employee
  const empRes = await request(app)
    .post('/auth/login')
    .send({ email: 'employee@example.com', password: 'password123' });
  employeeToken = empRes.body.access_token;

  // Login as manager
  const mgrRes = await request(app)
    .post('/auth/login')
    .send({ email: 'manager@example.com', password: 'password123' });
  managerToken = mgrRes.body.access_token;
});

afterAll(() => {
  closeDatabase();
});

describe('Expense CRUD', () => {
  let expenseId;

  test('should create an expense', async () => {
    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 2,
        amount: 150.50,
        description: 'Flight to conference',
        receipt_date: '2024-01-15'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.amount).toBe(150.50);
    expect(res.body.status).toBe('pending');
    expenseId = res.body.id;
  });

  test('should fail to create expense with invalid amount', async () => {
    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 2,
        amount: -50,
        description: 'Invalid expense',
        receipt_date: '2024-01-15'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('positive');
  });

  test('should fail to create expense with future date', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 2,
        amount: 50,
        description: 'Future expense',
        receipt_date: futureDate.toISOString().split('T')[0]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('future');
  });

  test('should get expense by ID', async () => {
    const res = await request(app)
      .get(`/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(expenseId);
  });

  test('should list expenses', async () => {
    const res = await request(app)
      .get('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('should update pending expense', async () => {
    const res = await request(app)
      .put(`/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 3,
        amount: 200.00,
        description: 'Updated description',
        receipt_date: '2024-01-15'
      });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(200.00);
    expect(res.body.description).toBe('Updated description');
  });

  test('should delete pending expense', async () => {
    // Create a new expense to delete
    const createRes = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 2,
        amount: 50,
        description: 'To be deleted',
        receipt_date: '2024-01-15'
      });

    const deleteRes = await request(app)
      .delete(`/expenses/${createRes.body.id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(deleteRes.status).toBe(204);

    // Verify it's deleted
    const getRes = await request(app)
      .get(`/expenses/${createRes.body.id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(getRes.status).toBe(404);
  });

  test('should filter expenses by status', async () => {
    const res = await request(app)
      .get('/expenses?status=pending')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every(e => e.status === 'pending')).toBe(true);
  });
});
