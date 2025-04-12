const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Simple connection without deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event_module');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Optional: Add event listeners for better debugging
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;