const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validation');

const router = express.Router();

// Register
router.post('/register', validateRegistration, (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user (defaults to employee role if not specified)
    const user = User.create({ email, password, name, role: role || 'employee' });
    const publicUser = User.toPublic(user);

    res.status(201).json(publicUser);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = User.findByEmail(email);
    if (!user || !User.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const publicUser = User.toPublic(user);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: publicUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const publicUser = User.toPublic(req.user);
  res.json(publicUser);
});

module.exports = router;
