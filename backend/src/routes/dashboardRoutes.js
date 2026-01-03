const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueChart,
  getTopRoutes,
  getPaymentMethodStats
} = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Tất cả routes yêu cầu Admin
router.get('/overview', authenticate, authorize('Admin'), getOverview);
router.get('/revenue-chart', authenticate, authorize('Admin'), getRevenueChart);
router.get('/top-routes', authenticate, authorize('Admin'), getTopRoutes);
router.get('/payment-methods', authenticate, authorize('Admin'), getPaymentMethodStats);

module.exports = router;