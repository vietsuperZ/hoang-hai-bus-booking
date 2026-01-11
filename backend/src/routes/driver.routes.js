const express = require('express');
const router = express.Router();
const { getMyTrips } = require('../controllers/driverController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/my-trips', authenticate, authorize('Tài xế'), getMyTrips);

module.exports = router;