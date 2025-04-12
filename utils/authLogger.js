const LoginAttempt = require('../models/LoginAttempt');

async function logLoginAttempt(email, ip, success, reason) {
  try {
    await LoginAttempt.create({
      email,
      ipAddress: ip,
      timestamp: new Date(),
      success,
      reason
    });
  } catch (err) {
    console.error('Failed to log login attempt:', err);
  }
}

module.exports = { logLoginAttempt };