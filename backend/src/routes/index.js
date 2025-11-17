const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const locationRoutes = require('./location.routes');
const busRoutes = require('./bus.routes');
const routeRoutes = require('./route.routes');
const tripRoutes = require('./trip.routes');
const bookingRoutes = require('./booking.routes');

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hoàng Hải Bus Booking API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;