const express = require('express');
const Category = require('../models/category');
const { authenticateToken } = require('../middleware/auth');
const { requireManager } = require('../middleware/roles');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, (req, res) => {
  try {
    const categories = Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category (manager only)
router.post('/', authenticateToken, requireManager, validateCategory, (req, res) => {
  try {
    const { name } = req.body;
    const category = Category.create(name);
    res.status(201).json(category);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Delete category (manager only)
router.delete('/:id', authenticateToken, requireManager, (req, res) => {
  try {
    const { id } = req.params;

    const category = Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    Category.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('Cannot delete system category')) {
      return res.status(400).json({ error: 'Cannot delete system category' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
