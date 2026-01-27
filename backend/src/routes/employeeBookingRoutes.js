const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  cancelBooking,
  cancelTicket,
  updateTicketStatus,
  getTrips,          // ← ĐẢM BẢO CÓ
  getTripDetail,     // ← ĐẢM BẢO CÓ
  getPrintInfo       // ← ĐẢM BẢO CÓ
} = require('../controllers/employeeBookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ===== ROUTES BOOKINGS =====
router.get('/bookings', authenticate, authorize('Nhân viên', 'Admin'), getAllBookings);
router.get('/bookings/:id', authenticate, authorize('Nhân viên', 'Admin'), getBookingDetail);
router.put('/bookings/:id/approve', authenticate, authorize('Nhân viên', 'Admin'), approvePayment);
router.put('/bookings/:id/cancel', authenticate, authorize('Nhân viên', 'Admin'), cancelBooking);
router.put('/tickets/:id/cancel', authenticate, authorize('Nhân viên', 'Admin'), cancelTicket);
router.put('/tickets/:id/status', authenticate, authorize('Nhân viên', 'Admin'), updateTicketStatus);

// ===== ROUTES TRIPS (THÊM MỚI) =====
router.get('/trips', authenticate, authorize('Nhân viên', 'Admin'), getTrips);
router.get('/trips/:id', authenticate, authorize('Nhân viên', 'Admin'), getTripDetail);
router.get('/trips/:id/print', authenticate, authorize('Nhân viên', 'Admin'), getPrintInfo);

module.exports = router;