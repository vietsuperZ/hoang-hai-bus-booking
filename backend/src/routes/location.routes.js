const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getAllLocations);
router.get('/:id', getLocationById);

// Admin only routes
router.post('/', authenticate, authorize('Admin'), createLocation);
router.put('/:id', authenticate, authorize('Admin'), updateLocation);
router.delete('/:id', authenticate, authorize('Admin'), deleteLocation);

module.exports = router;