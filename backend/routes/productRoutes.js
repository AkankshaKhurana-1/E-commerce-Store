const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/products/categories
// Must be defined BEFORE /:id to avoid "categories" being treated as an ID
router.get('/categories', getCategories);

// @route   GET /api/products
router.get('/', getProducts);

// @route   GET /api/products/:id
router.get('/:id', getProductById);

// @route   POST /api/products (Admin only)
router.post('/', protect, admin, createProduct);

module.exports = router;
