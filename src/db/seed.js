const { getDatabase } = require('../utils/db');
const bcrypt = require('bcrypt');

function seedDatabase() {
  const db = getDatabase();

  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create system category
  const insertCategory = db.prepare('INSERT INTO categories (name, is_system) VALUES (?, ?)');
  insertCategory.run('Uncategorized', 1);

  // Create regular categories
  insertCategory.run('Travel', 0);
  insertCategory.run('Meals', 0);
  insertCategory.run('Software', 0);

  // Create users
  const managerPasswordHash = bcrypt.hashSync('password123', 10);
  const employeePasswordHash = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)');
  insertUser.run('manager@example.com', managerPasswordHash, 'Manager User', 'manager');
  insertUser.run('employee@example.com', employeePasswordHash, 'Employee User', 'employee');

  console.log('Database seeded successfully');
}

module.exports = { seedDatabase };
