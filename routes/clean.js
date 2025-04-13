// COMPLETELY NEW IMPLEMENTATION
const express = require('express');
const router = express.Router();

// 1. Define controller directly in route file
const getDashboard = async (req, res) => {
  try {
    res.send('This is the clean route');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// 2. Register route with NO middleware first
router.get('/clean', getDashboard);

// 3. Then add middleware gradually
const ensureAdmin = (req, res, next) => {
  console.log('Mock admin check');
  next();
};

router.get('/clean-with-middleware', ensureAdmin, getDashboard);

module.exports = router;