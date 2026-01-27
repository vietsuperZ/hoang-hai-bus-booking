const express = require('express');
const router = express.Router();
const {
  createReview,
  getMyReviewForTrip,
  getReviewsByTrip,
  updateReview,
  deleteReview,
  getLatestReviews,
  getAllReviewsForAdmin,
  getReviewStatistics,
  deleteReviewByAdmin
} = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/latest', getLatestReviews);
router.get('/trip/:tripId', getReviewsByTrip);

// Private routes
router.post('/', authenticate, createReview);
router.get('/trip/:tripId/my-review', authenticate, getMyReviewForTrip);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

// Admin routes
router.get('/admin/all', authenticate, authorize('Admin'), getAllReviewsForAdmin);
router.get('/admin/statistics', authenticate, authorize('Admin'), getReviewStatistics);
router.delete('/admin/:id', authenticate, authorize('Admin'), deleteReviewByAdmin);
module.exports = router;