const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBusByPlate,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes are Admin only
router.use(authenticate, authorize('Admin'));

router.get('/', getAllBuses);
router.get('/:bienSoXe', getBusByPlate);
router.post('/', createBus);
router.put('/:bienSoXe', updateBus);
router.delete('/:bienSoXe', deleteBus);

module.exports = router;