const { getDatabase } = require('../utils/db');

function initializeDatabase() {
  const db = getDatabase();

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'manager')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_system BOOLEAN DEFAULT 0
    )
  `);

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      description TEXT NOT NULL,
      receipt_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
    CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_receipt_date ON expenses(receipt_date);
  `);

  console.log('Database schema initialized');
}

module.exports = { initializeDatabase };
