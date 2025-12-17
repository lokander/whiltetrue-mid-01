const { getDatabase } = require('../utils/db');

class Category {
  static create(name) {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO categories (name, is_system) VALUES (?, 0)');
    const result = stmt.run(name);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id);
  }

  static findAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    return stmt.all();
  }

  static findUncategorized() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM categories WHERE is_system = 1 LIMIT 1');
    return stmt.get();
  }

  static delete(id) {
    const db = getDatabase();

    // Get the category to check if it's a system category
    const category = this.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    if (category.is_system) {
      throw new Error('Cannot delete system category');
    }

    // Get the uncategorized category ID
    const uncategorized = this.findUncategorized();

    // Move all expenses to uncategorized before deleting
    const updateExpenses = db.prepare('UPDATE expenses SET category_id = ? WHERE category_id = ?');
    updateExpenses.run(uncategorized.id, id);

    // Delete the category
    const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');
    deleteStmt.run(id);
  }
}

module.exports = Category;
