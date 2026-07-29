const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET ALL PRODUCTS (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, stock: { $gt: 0 } })
      .select('-__v')
      .limit(50);
    res.json({ status: 'success', data: products });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil produk' });
  }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }
    res.json({ status: 'success', data: product });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil produk' });
  }
});

module.exports = router;