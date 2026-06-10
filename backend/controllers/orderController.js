const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private (requires JWT)
 */
const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod, totalAmount } = req.body;

    // Validate required fields
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    const {
      fullName,
      address,
      city,
      postalCode,
      country,
      phone,
    } = shippingAddress;

    if (!fullName || !address || !city || !postalCode || !country || !phone) {
      return res
        .status(400)
        .json({ message: 'All shipping address fields are required' });
    }

    // Validate products exist and have sufficient stock
    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
      });

      calculatedTotal += product.price * item.quantity;
    }

    // Calculate shipping (free over $100)
    const shippingPrice = calculatedTotal > 100 ? 0 : 10;
    const finalTotal = calculatedTotal + shippingPrice;

    // Create the order
    const order = await Order.create({
      user: req.user._id,
      products: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totalAmount: finalTotal,
      shippingPrice,
      status: 'Pending',
    });

    // Decrement stock for each product
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Populate user and product details in response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('products.product', 'name image');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder,
    });
  } catch (error) {
    console.error('Create order error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID in order' });
    }

    res.status(500).json({ message: 'Server error creating order' });
  }
};

/**
 * @desc    Get all orders for the logged-in user
 * @route   GET /api/orders/user
 * @access  Private
 */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('products.product', 'name image price')
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('products.product', 'name image price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure user can only access their own orders
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    res.status(500).json({ message: 'Server error fetching order' });
  }
};

module.exports = { createOrder, getUserOrders, getOrderById };
