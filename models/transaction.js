const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['topup', 'withdraw', 'payment', 'refund', 'transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    default: 0
  },
  method: {
    type: String,
    enum: ['qris', 'bank', 'ewallet', 'saldo']
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'expired'],
    default: 'pending'
  },
  referenceId: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  metadata: {
    type: Object,
    default: {}
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
