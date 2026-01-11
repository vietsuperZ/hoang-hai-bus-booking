const express = require('express');
const router = express.Router();
const {
  searchTrips,
  getAllTrips,
  getTripById,
  getTripSeats,
  createTrip,
  updateTrip,
  deleteTrip
} = require('../controllers/tripController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getTripPassengers } = require('../controllers/tripController');

// Public routes
router.get('/search', searchTrips);
router.get('/:id', getTripById);
router.get('/:id/seats', getTripSeats);
router.get('/:id/passengers', authenticate, authorize('Admin', 'Nhân viên', 'Tài xế'), getTripPassengers);

// Admin only routes
router.get('/', authenticate, authorize('Admin'), getAllTrips);
router.post('/', authenticate, authorize('Admin'), createTrip);
router.put('/:id', authenticate, authorize('Admin'), updateTrip);
router.delete('/:id', authenticate, authorize('Admin'), deleteTrip);

module.exports = router;