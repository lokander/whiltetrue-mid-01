function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function validateAmount(amount) {
  return amount && amount > 0;
}

function validateDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return !isNaN(date.getTime()) && date <= today;
}

function validateRegistration(req, res, next) {
  const { email, password, name } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  next();
}

function validateExpense(req, res, next) {
  const { category_id, amount, description, receipt_date } = req.body;

  if (!category_id) {
    return res.status(400).json({ error: 'Category is required' });
  }

  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!receipt_date || !validateDate(receipt_date)) {
    return res.status(400).json({ error: 'Valid receipt date is required and cannot be in the future' });
  }

  next();
}

function validateCategory(req, res, next) {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  next();
}

function validateRejection(req, res, next) {
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  next();
}

module.exports = {
  validateRegistration,
  validateExpense,
  validateCategory,
  validateRejection
};
