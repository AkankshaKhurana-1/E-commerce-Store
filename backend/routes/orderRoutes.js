const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All order routes require authentication
// @route   POST /api/orders
router.post('/', protect, createOrder);

// @route   GET /api/orders/user
router.get('/user', protect, getUserOrders);

// @route   GET /api/orders/:id
router.get('/:id', protect, getOrderById);

module.exports = router;
