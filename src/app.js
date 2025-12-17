const express = require('express');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');

function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/expenses', expenseRoutes);
  app.use('/reports', reportRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
