const express = require('express');
const { getDatabase } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');
const { requireManager } = require('../middleware/roles');

const router = express.Router();

// Helper function to get date range defaults
function getDateRange(fromDate, toDate) {
  const now = new Date();
  const from = fromDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = toDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

// Summary by category
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const { from, to } = getDateRange(from_date, to_date);
    const db = getDatabase();

    let query = `
      SELECT c.name as category,
             SUM(e.amount) as total,
             COUNT(e.id) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.receipt_date >= ? AND e.receipt_date <= ?
    `;

    const params = [from, to];

    // Employees see only their own data
    if (req.user.role === 'employee') {
      query += ' AND e.user_id = ?';
      params.push(req.user.id);
    }

    query += ' GROUP BY c.id, c.name ORDER BY total DESC';

    const stmt = db.prepare(query);
    const items = stmt.all(...params);

    // Calculate grand total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    res.json({
      items,
      grand_total: grandTotal,
      from_date: from,
      to_date: to
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ error: 'Failed to generate summary report' });
  }
});

// Summary by user (manager only)
router.get('/by-user', authenticateToken, requireManager, (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const { from, to } = getDateRange(from_date, to_date);
    const db = getDatabase();

    const query = `
      SELECT u.name as user,
             u.email,
             SUM(e.amount) as total,
             COUNT(e.id) as count
      FROM expenses e
      JOIN users u ON e.user_id = u.id
      WHERE e.receipt_date >= ? AND e.receipt_date <= ?
      GROUP BY u.id, u.name, u.email
      ORDER BY total DESC
    `;

    const stmt = db.prepare(query);
    const items = stmt.all(from, to);

    // Calculate grand total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    res.json({
      items,
      grand_total: grandTotal,
      from_date: from,
      to_date: to
    });
  } catch (error) {
    console.error('Error generating by-user report:', error);
    res.status(500).json({ error: 'Failed to generate by-user report' });
  }
});

// Summary by status
router.get('/by-status', authenticateToken, (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const { from, to } = getDateRange(from_date, to_date);
    const db = getDatabase();

    let query = `
      SELECT e.status,
             SUM(e.amount) as total,
             COUNT(e.id) as count
      FROM expenses e
      WHERE e.receipt_date >= ? AND e.receipt_date <= ?
    `;

    const params = [from, to];

    // Employees see only their own data
    if (req.user.role === 'employee') {
      query += ' AND e.user_id = ?';
      params.push(req.user.id);
    }

    query += ' GROUP BY e.status ORDER BY total DESC';

    const stmt = db.prepare(query);
    const items = stmt.all(...params);

    // Calculate grand total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    res.json({
      items,
      grand_total: grandTotal,
      from_date: from,
      to_date: to
    });
  } catch (error) {
    console.error('Error generating by-status report:', error);
    res.status(500).json({ error: 'Failed to generate by-status report' });
  }
});

module.exports = router;
