const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  searchRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getAllRoutes);
router.get('/search', searchRoutes);
router.get('/:id', getRouteById);

// Admin only routes
router.post('/', authenticate, authorize('Admin'), createRoute);
router.put('/:id', authenticate, authorize('Admin'), updateRoute);
router.delete('/:id', authenticate, authorize('Admin'), deleteRoute);

module.exports = router;