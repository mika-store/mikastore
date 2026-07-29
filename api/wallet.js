const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ronzzpay = require('../utils/ronzzpay');

const verifyToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this');
};

// CEK SALDO
router.get('/balance', async (req, res) => {
  try {
    const decoded = await verifyToken(req);
    const user = await User.findById(decoded.id).select('saldo');
    res.json({ status: 'success', data: { saldo: user.saldo } });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
});

// TOPUP SALDO VIA QRIS
router.post('/topup',
  [
    body('amount')
      .isInt({ min: 10000, max: 10000000 })
      .withMessage('Minimal topup Rp10.000, maksimal Rp10.000.000')
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

      const decoded = await verifyToken(req);
      const user = await User.findById(decoded.id);
      const { amount } = req.body;

      const result = await ronzzpay.createTransaction({
        code: 'qris',
        amount: amount,
        description: `Topup saldo ${user.username}`
      });

      if (!result.status) {
        return res.status(400).json({
          status: 'error',
          message: result.message || 'Gagal generate QRIS'
        });
      }

      const transaction = new Transaction({
        user: user._id,
        type: 'topup',
        amount: amount,
        fee: result.data.fee || 0,
        method: 'qris',
        status: 'pending',
        referenceId: result.data.reff_id,
        description: `Topup saldo via QRIS`,
        metadata: result.data
      });
      await transaction.save();

      res.json({
        status: 'success',
        data: {
          transactionId: transaction._id,
          reff_id: result.data.reff_id,
          qr_image: result.data.qr_image,
          amount: amount,
          fee: result.data.fee || 0,
          total: result.data.amount || amount,
          expired_at: result.data.expired_at,
          instructions: result.data.instructions
        }
      });
    } catch (error) {
      console.error('Topup error:', error);
      res.status(500).json({ status: 'error', message: 'Gagal topup saldo' });
    }
  }
);

// RIWAYAT TRANSAKSI
router.get('/history', async (req, res) => {
  try {
    const decoded = await verifyToken(req);
    const transactions = await Transaction.find({ user: decoded.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ status: 'success', data: transactions });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
});

module.exports = router;