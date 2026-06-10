/**
 * Database Seeder
 * Run: node seeder.js
 * Seeds the database with sample products for development/demo
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const sampleProducts = [
  // ── Electronics ──────────────────────────────────────────────────────────
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description:
      'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Perfect for music lovers and remote workers.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    category: 'Electronics',
    stock: 45,
    rating: 4.5,
    numReviews: 128,
  },
  {
    name: 'Smart Watch Pro',
    description:
      'Feature-packed smartwatch with health monitoring, GPS, heart rate sensor, sleep tracking, and 7-day battery. Compatible with iOS and Android.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    category: 'Electronics',
    stock: 30,
    rating: 4.3,
    numReviews: 95,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      'Waterproof portable speaker with 360° surround sound, 12-hour playtime, and built-in microphone. Great for outdoor adventures.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
    category: 'Electronics',
    stock: 60,
    rating: 4.4,
    numReviews: 210,
  },
  {
    name: '4K Ultra HD Webcam',
    description:
      'Professional 4K webcam with autofocus, built-in ring light, and noise-cancelling microphone. Ideal for streaming and video calls.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
    category: 'Electronics',
    stock: 25,
    rating: 4.2,
    numReviews: 67,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description:
      'RGB backlit mechanical keyboard with tactile switches, anti-ghosting, and aluminum frame. Built for competitive gaming.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&q=80',
    category: 'Electronics',
    stock: 40,
    rating: 4.6,
    numReviews: 183,
  },

  // ── Clothing ─────────────────────────────────────────────────────────────
  {
    name: 'Classic Cotton T-Shirt',
    description:
      'Soft 100% organic cotton t-shirt available in multiple colors. Comfortable everyday wear with a relaxed fit.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    category: 'Clothing',
    stock: 150,
    rating: 4.1,
    numReviews: 342,
  },
  {
    name: 'Slim Fit Denim Jeans',
    description:
      'Premium stretch denim jeans with a modern slim fit. Durable, comfortable, and stylish for any occasion.',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    category: 'Clothing',
    stock: 80,
    rating: 4.3,
    numReviews: 156,
  },
  {
    name: 'Hooded Zip-Up Sweatshirt',
    description:
      'Cozy fleece-lined hoodie with front zip, kangaroo pocket, and adjustable drawstring. Perfect for cool weather.',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    category: 'Clothing',
    stock: 70,
    rating: 4.4,
    numReviews: 89,
  },

  // ── Books ─────────────────────────────────────────────────────────────────
  {
    name: 'Clean Code: A Handbook',
    description:
      'Robert C. Martin\'s essential guide to writing clean, maintainable code. A must-read for every software developer.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    category: 'Books',
    stock: 55,
    rating: 4.8,
    numReviews: 512,
  },
  {
    name: 'JavaScript: The Good Parts',
    description:
      'Douglas Crockford\'s classic book on the best features of JavaScript. Essential reading for web developers.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80',
    category: 'Books',
    stock: 40,
    rating: 4.5,
    numReviews: 287,
  },

  // ── Home & Garden ─────────────────────────────────────────────────────────
  {
    name: 'Ceramic Coffee Mug Set',
    description:
      'Set of 4 handcrafted ceramic mugs with minimalist design. Microwave and dishwasher safe. Capacity: 12oz each.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    category: 'Home & Garden',
    stock: 90,
    rating: 4.6,
    numReviews: 203,
  },
  {
    name: 'Scented Soy Candle Collection',
    description:
      'Set of 3 hand-poured soy wax candles in lavender, vanilla, and eucalyptus scents. 40-hour burn time each.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1602607144535-11be3fe48d5e?w=600&q=80',
    category: 'Home & Garden',
    stock: 65,
    rating: 4.7,
    numReviews: 178,
  },

  // ── Sports ────────────────────────────────────────────────────────────────
  {
    name: 'Yoga Mat Premium',
    description:
      'Non-slip 6mm thick yoga mat with alignment lines, carrying strap, and eco-friendly TPE material. Perfect for all yoga styles.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1601925228008-f5e4c5e5e5e5?w=600&q=80',
    category: 'Sports',
    stock: 75,
    rating: 4.5,
    numReviews: 134,
  },
  {
    name: 'Adjustable Dumbbell Set',
    description:
      'Space-saving adjustable dumbbells ranging from 5 to 52.5 lbs. Quick-change weight system for efficient home workouts.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    category: 'Sports',
    stock: 20,
    rating: 4.7,
    numReviews: 98,
  },

  // ── Beauty ────────────────────────────────────────────────────────────────
  {
    name: 'Vitamin C Serum',
    description:
      'Brightening vitamin C serum with hyaluronic acid and niacinamide. Reduces dark spots and boosts collagen production.',
    price: 28.99,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
    category: 'Beauty',
    stock: 100,
    rating: 4.4,
    numReviews: 267,
  },
  {
    name: 'Natural Face Moisturizer',
    description:
      'Lightweight daily moisturizer with SPF 30, aloe vera, and green tea extract. Suitable for all skin types.',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    category: 'Beauty',
    stock: 85,
    rating: 4.3,
    numReviews: 189,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${inserted.length} products successfully`);

    console.log('\n📦 Sample products added:');
    inserted.forEach((p) => console.log(`   - ${p.name} ($${p.price})`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
