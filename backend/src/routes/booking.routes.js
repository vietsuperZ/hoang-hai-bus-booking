const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  approveBooking,
  getAllBookings,
  autoApproveBooking,
  cassoWebhook,      // THÊM
  checkPaymentStatus,
  approveCancellation,
  completeRefund // THÊM
} = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public webhook - Casso sẽ gọi vào đây
router.post('/casso-webhook', cassoWebhook);

// Customer routes
router.post('/', authenticate, createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.post('/check-payment', authenticate, checkPaymentStatus); // THÊM
router.get('/:id', authenticate, getBookingById);
router.delete('/:id', authenticate, cancelBooking);

// Employee/Admin routes
router.get('/', authenticate, authorize('Admin', 'Nhân viên'), getAllBookings);
router.put('/:id/approve', authenticate, authorize('Admin', 'Nhân viên'), approveBooking);
router.put('/:id/auto-approve', authenticate, autoApproveBooking);
router.put('/:id/approve-cancel', authenticate, approveCancellation);
router.put('/:id/complete-refund', authenticate, completeRefund);

module.exports = router;