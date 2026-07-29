const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const verifyToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this');
};

// CREATE ORDER
router.post('/create', async (req, res) => {
  try {
    const decoded = await verifyToken(req);
    const { productId, quantity, paymentMethod = 'qris' } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ status: 'error', message: 'Stok tidak cukup' });
    }

    const totalAmount = product.price * quantity;

    const user = await User.findById(decoded.id);
    if (paymentMethod === 'saldo' && user.saldo < totalAmount) {
      return res.status(400).json({ status: 'error', message: 'Saldo tidak cukup' });
    }

    const order = new Order({
      user: decoded.id,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity
      }],
      totalAmount: totalAmount,
      shippingAddress: user.address,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'saldo' ? 'paid' : 'pending',
      orderStatus: 'pending'
    });
    await order.save();

    if (paymentMethod === 'saldo') {
      user.saldo -= totalAmount;
      await user.save();
    }

    product.stock -= quantity;
    await product.save();

    res.json({
      status: 'success',
      data: { order, paymentMethod }
    });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat pesanan' });
  }
});

// GET MY ORDERS
router.get('/my', async (req, res) => {
  try {
    const decoded = await verifyToken(req);
    const orders = await Order.find({ user: decoded.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price images');
    res.json({ status: 'success', data: orders });
  } catch (error) {
    res.status(401).json({ status: 'error', message: error.message });
  }
});

module.exports = router;