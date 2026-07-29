const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// ==========================================
//   REGISTER
// ==========================================

router.post('/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username hanya boleh huruf, angka, dan underscore'),
    body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password minimal 8 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password harus mengandung huruf besar, kecil, dan angka')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
      }

      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: existingUser.email === email ? 'Email sudah terdaftar' : 'Username sudah digunakan'
        });
      }

      const user = new User({ username, email, password });
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_change_this',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        status: 'success',
        data: { user: user.toJSON(), token }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ status: 'error', message: 'Gagal mendaftar' });
    }
  }
);

// ==========================================
//   LOGIN
// ==========================================

router.post('/login',
  [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').notEmpty().withMessage('Password wajib diisi')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Email atau password salah'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          status: 'error',
          message: 'Akun Anda dinonaktifkan'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_change_this',
        { expiresIn: '7d' }
      );

      res.json({
        status: 'success',
        data: { user: user.toJSON(), token }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ status: 'error', message: 'Gagal login' });
    }
  }
);

// ==========================================
//   GET CURRENT USER
// ==========================================

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User tidak ditemukan' });
    }
    
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Token tidak valid' });
  }
});

module.exports = router;