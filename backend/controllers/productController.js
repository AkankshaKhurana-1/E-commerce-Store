const Product = require('../models/Product');

/**
 * @desc    Get all products with search and filter
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

    // Build query object
    const query = {};

    // Search by name or description (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);

    // Handle invalid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    res.status(500).json({ message: 'Server error fetching product' });
  }
};

/**
 * @desc    Get all unique categories
 * @route   GET /api/products/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

/**
 * @desc    Create a new product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
      stock: stock || 0,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating product' });
  }
};

module.exports = { getProducts, getProductById, getCategories, createProduct };
