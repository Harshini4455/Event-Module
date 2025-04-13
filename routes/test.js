const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminController');

router.get('/test', (req, res) => {
  console.log('Direct function test:', typeof getAdminDashboard);
  getAdminDashboard(req, res);
});

module.exports = router;