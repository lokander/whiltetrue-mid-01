const { getDatabase } = require('../utils/db');
const bcrypt = require('bcrypt');

class User {
  static create({ email, password, name, role = 'employee' }) {
    const db = getDatabase();
    const passwordHash = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(email, passwordHash, name, role);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static verifyPassword(password, passwordHash) {
    return bcrypt.compareSync(password, passwordHash);
  }

  static toPublic(user) {
    if (!user) return null;
    const { password_hash, ...publicUser } = user;
    return publicUser;
  }
}

module.exports = User;
