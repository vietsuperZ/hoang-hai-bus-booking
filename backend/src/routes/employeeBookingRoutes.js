const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  cancelBooking, // ← ĐỔI TÊN
  cancelTicket, // ← THÊM MỚI
  updateTicketStatus
} = require('../controllers/employeeBookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Routes cho Nhân viên Thu ngân
router.get('/bookings', authenticate, authorize('Nhân viên', 'Admin'), getAllBookings);
router.get('/bookings/:id', authenticate, authorize('Nhân viên', 'Admin'), getBookingDetail);
router.put('/bookings/:id/approve', authenticate, authorize('Nhân viên', 'Admin'), approvePayment);
router.put('/bookings/:id/cancel', authenticate, authorize('Nhân viên', 'Admin'), cancelBooking); // ← ĐỔI ROUTE
router.put('/tickets/:id/cancel', authenticate, authorize('Nhân viên', 'Admin'), cancelTicket); // ← THÊM MỚI
router.put('/tickets/:id/status', authenticate, authorize('Nhân viên', 'Admin'), updateTicketStatus);

module.exports = router;