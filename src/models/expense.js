const { getDatabase } = require('../utils/db');

class Expense {
  static create({ userId, categoryId, amount, description, receiptDate }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO expenses (user_id, category_id, amount, description, receipt_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, categoryId, amount, description, receiptDate);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT e.*, c.name as category_name, u.name as user_name,
             r.name as reviewer_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users r ON e.reviewed_by = r.id
      WHERE e.id = ?
    `);
    return stmt.get(id);
  }

  static findAll({ userId = null, status = null, categoryId = null, fromDate = null, toDate = null, limit = 20, offset = 0 }) {
    const db = getDatabase();
    let query = `
      SELECT e.*, c.name as category_name, u.name as user_name,
             r.name as reviewer_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN users r ON e.reviewed_by = r.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND e.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }

    if (fromDate) {
      query += ' AND e.receipt_date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      query += ' AND e.receipt_date <= ?';
      params.push(toDate);
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params);
    const count = countResult ? countResult.count : 0;

    // Add ordering and pagination
    query += ' ORDER BY e.receipt_date DESC, e.created_at DESC LIMIT ? OFFSET ?';
    params.push(Math.min(limit, 100), offset);

    const stmt = db.prepare(query);
    const items = stmt.all(...params);

    return { items, total: count, limit, offset };
  }

  static update(id, { categoryId, amount, description, receiptDate }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE expenses
      SET category_id = ?, amount = ?, description = ?, receipt_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(categoryId, amount, description, receiptDate, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(id);
  }

  static approve(id, reviewerId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE expenses
      SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(reviewerId, id);
    return this.findById(id);
  }

  static reject(id, reviewerId, reason) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE expenses
      SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
          rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(reviewerId, reason, id);
    return this.findById(id);
  }
}

module.exports = Expense;
