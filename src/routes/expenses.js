const express = require('express');
const Expense = require('../models/expense');
const Category = require('../models/category');
const { authenticateToken } = require('../middleware/auth');
const { requireManager } = require('../middleware/roles');
const { validateExpense, validateRejection } = require('../middleware/validation');

const router = express.Router();

// Create expense
router.post('/', authenticateToken, validateExpense, (req, res) => {
  try {
    const { category_id, amount, description, receipt_date } = req.body;

    // Check if category exists
    const category = Category.findById(category_id);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const expense = Expense.create({
      userId: req.user.id,
      categoryId: category_id,
      amount,
      description,
      receiptDate: receipt_date
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get all expenses (filtered by role)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, category_id, from_date, to_date, limit = 20, offset = 0 } = req.query;

    // Employees see only their own expenses, managers see all
    const userId = req.user.role === 'employee' ? req.user.id : null;

    const result = Expense.findAll({
      userId,
      status,
      categoryId: category_id,
      fromDate: from_date,
      toDate: to_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get pending expenses (manager only)
router.get('/pending', authenticateToken, requireManager, (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = Expense.findAll({
      status: 'pending',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching pending expenses:', error);
    res.status(500).json({ error: 'Failed to fetch pending expenses' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const expense = Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Employees can only view their own expenses
    if (req.user.role === 'employee' && expense.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Update expense
router.put('/:id', authenticateToken, validateExpense, (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, description, receipt_date } = req.body;

    const expense = Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Can only update own expenses
    if (expense.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can only update pending expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot modify approved or rejected expenses' });
    }

    // Check if category exists
    const category = Category.findById(category_id);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const updated = Expense.update(id, {
      categoryId: category_id,
      amount,
      description,
      receiptDate: receipt_date
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const expense = Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Can only delete own expenses
    if (expense.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can only delete pending expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete approved or rejected expenses' });
    }

    Expense.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Approve expense (manager only)
router.post('/:id/approve', authenticateToken, requireManager, (req, res) => {
  try {
    const { id } = req.params;

    const expense = Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Cannot approve own expenses
    if (expense.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot approve your own expenses' });
    }

    // Can only approve pending expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({ error: 'Expense is not pending' });
    }

    const updated = Expense.approve(id, req.user.id);
    res.json(updated);
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

// Reject expense (manager only)
router.post('/:id/reject', authenticateToken, requireManager, validateRejection, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const expense = Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Cannot reject own expenses
    if (expense.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot reject your own expenses' });
    }

    // Can only reject pending expenses
    if (expense.status !== 'pending') {
      return res.status(400).json({ error: 'Expense is not pending' });
    }

    const updated = Expense.reject(id, req.user.id, reason);
    res.json(updated);
  } catch (error) {
    console.error('Error rejecting expense:', error);
    res.status(500).json({ error: 'Failed to reject expense' });
  }
});

module.exports = router;
