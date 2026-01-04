const express = require('express');
const router = express.Router();
const { getAllRefunds, processRefund } = require('../controllers/refundController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Routes cho Nhân viên
router.get('/', authenticate, authorize('Nhân viên', 'Admin'), getAllRefunds);
router.put('/:id/process', authenticate, authorize('Nhân viên', 'Admin'), processRefund);

module.exports = router;