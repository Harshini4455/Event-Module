const mongoose = require('mongoose');

const LoginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ipAddress: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  reason: String,
  userAgent: String
});

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);