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

describe('Approval Workflow', () => {
  let expenseId;

  beforeEach(async () => {
    // Create a new expense for each test
    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 2,
        amount: 100.00,
        description: 'Test expense',
        receipt_date: '2024-01-15'
      });
    expenseId = res.body.id;
  });

  test('manager should be able to approve expense', async () => {
    const res = await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.reviewed_by).toBeTruthy();
    expect(res.body.reviewed_at).toBeTruthy();
  });

  test('manager should be able to reject expense with reason', async () => {
    const res = await request(app)
      .post(`/expenses/${expenseId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reason: 'Missing receipt' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.rejection_reason).toBe('Missing receipt');
    expect(res.body.reviewed_by).toBeTruthy();
  });

  test('should fail to reject without reason', async () => {
    const res = await request(app)
      .post(`/expenses/${expenseId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('reason');
  });

  test('employee should not be able to approve expenses', async () => {
    const res = await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Manager');
  });

  test('should not be able to update approved expense', async () => {
    // First approve the expense
    await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    // Try to update it
    const res = await request(app)
      .put(`/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        category_id: 3,
        amount: 200.00,
        description: 'Updated',
        receipt_date: '2024-01-15'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot modify');
  });

  test('should not be able to delete approved expense', async () => {
    // First approve the expense
    await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    // Try to delete it
    const res = await request(app)
      .delete(`/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot delete');
  });

  test('should not be able to approve already approved expense', async () => {
    // First approve
    await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    // Try to approve again
    const res = await request(app)
      .post(`/expenses/${expenseId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not pending');
  });

  test('manager should get list of pending expenses', async () => {
    const res = await request(app)
      .get('/expenses/pending')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items.every(e => e.status === 'pending')).toBe(true);
  });

  test('employee should not access pending expenses endpoint', async () => {
    const res = await request(app)
      .get('/expenses/pending')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  test('manager should not be able to approve own expense', async () => {
    // Create expense as manager
    const createRes = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        category_id: 2,
        amount: 100.00,
        description: 'Manager expense',
        receipt_date: '2024-01-15'
      });

    // Try to approve own expense
    const res = await request(app)
      .post(`/expenses/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('own');
  });
});
