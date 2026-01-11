const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { updateProfile, changePassword } = require('../controllers/profileController'); // ← Import từ profileController
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, updateProfile);              // ← Từ profileController
router.put('/change-password', authenticate, changePassword);     // ← Từ profileController

module.exports = router;
