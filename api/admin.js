const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const verifyAdmin = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_this');
  const user = await User.findById(decoded.id);
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new Error('Forbidden');
  }
  return user;
};

// ==========================================
//   STATS
// ==========================================

router.get('/stats', async (req, res) => {
  try {
    await verifyAdmin(req);
    const [products, orders, users] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments()
    ]);
    res.json({
      status: 'success',
      data: { products, orders, users }
    });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   GET ALL PRODUCTS (ADMIN)
// ==========================================

router.get('/products', async (req, res) => {
  try {
    await verifyAdmin(req);
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ status: 'success', data: products });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   CREATE PRODUCT
// ==========================================

router.post('/products', async (req, res) => {
  try {
    const admin = await verifyAdmin(req);
    const { name, description, price, stock, category } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const product = new Product({
      name,
      slug,
      description,
      price,
      stock,
      category,
      seller: admin._id
    });
    await product.save();
    
    res.json({ status: 'success', data: product });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   TOGGLE PRODUCT
// ==========================================

router.put('/products/:id/toggle', async (req, res) => {
  try {
    await verifyAdmin(req);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }
    product.isActive = !product.isActive;
    await product.save();
    res.json({ status: 'success', data: product });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   GET ALL ORDERS
// ==========================================

router.get('/orders', async (req, res) => {
  try {
    await verifyAdmin(req);
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username email')
      .populate('items.product', 'name');
    res.json({ status: 'success', data: orders });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   UPDATE ORDER STATUS
// ==========================================

router.put('/orders/:id/status', async (req, res) => {
  try {
    await verifyAdmin(req);
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan' });
    }
    order.orderStatus = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();
    res.json({ status: 'success', data: order });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   GET ALL USERS
// ==========================================

router.get('/users', async (req, res) => {
  try {
    await verifyAdmin(req);
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ status: 'success', data: users });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

// ==========================================
//   TOGGLE USER
// ==========================================

router.put('/users/:id/toggle', async (req, res) => {
  try {
    await verifyAdmin(req);
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(403).json({ status: 'error', message: error.message });
  }
});

module.exports = router;