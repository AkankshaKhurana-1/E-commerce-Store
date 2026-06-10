const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connect to MongoDB Atlas (with in-memory fallback)
 */
const connectDB = async () => {
  try {
    // Attempt connecting to MongoDB Atlas with a 4-second timeout to fail-fast
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ MongoDB Connected (Atlas): ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas Connection Failed: ${error.message}`);
    console.log('🔄 Spinning up local in-memory MongoDB fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ Connected to In-Memory MongoDB: ${conn.connection.host}`);
      
      // Auto-seed in-memory database so the app is immediately populated with data
      console.log('🌱 Seeding in-memory database...');
      const { seedProducts } = require('../seeder');
      await seedProducts();
      console.log('✅ In-Memory database successfully initialized and seeded.');
    } catch (fallbackError) {
      console.error(`❌ In-Memory MongoDB Fallback Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
