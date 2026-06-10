const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses the MONGO_URI environment variable from .env
 */
const connectDB = async () => {
  try {
    // Mongoose 8+ does not need useNewUrlParser / useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
