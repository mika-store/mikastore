const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const config = {
  API_BASE: process.env.RONZZPAY_API_BASE || 'https://pg.ronzzyt.id/api',
  API_KEY: process.env.RONZZPAY_API_KEY,
  WEBHOOK_URL: process.env.RONZZPAY_WEBHOOK_URL
};

const createTransaction = async ({ code, amount, description }) => {
  try {
    const response = await axios.post(`${config.API_BASE}/transaction/create`, {
      api_key: config.API_KEY,
      code,
      amount,
      description,
      webhook_url: config.WEBHOOK_URL
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    return {
      status: false,
      message: error.response?.data?.message || error.message
    };
  }
};

const getTransactionStatus = async (reffId) => {
  try {
    const response = await axios.post(`${config.API_BASE}/transaction/status`, {
      api_key: config.API_KEY,
      reff_id: reffId
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    return {
      status: false,
      message: error.response?.data?.message || error.message
    };
  }
};

const handleWebhook = async (data) => {
  try {
    const { reff_id, status, amount } = data;
    
    if (status !== 'success') return;
    
    const transaction = await Transaction.findOne({ 
      referenceId: reff_id,
      status: 'pending'
    }).populate('user');
    
    if (!transaction) return;
    
    await User.findByIdAndUpdate(transaction.user._id, {
      $inc: { saldo: transaction.amount }
    });
    
    transaction.status = 'success';
    transaction.completedAt = new Date();
    await transaction.save();
    
    console.log(`✅ Topup success: ${reff_id} - ${transaction.user.email}`);
  } catch (error) {
    console.error('Webhook error:', error);
  }
};

module.exports = {
  createTransaction,
  getTransactionStatus,
  handleWebhook
};