// backend/src/controllers/notificationController.js
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// @desc    Lấy thông báo của user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    
    const whereCondition = { MaNguoiDung: req.user.MaNguoiDung };
    if (unreadOnly === 'true') {
      whereCondition.TrangThaiDoc = 0;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereCondition,
      order: [['NgayThongBao', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json(notifications.rows)

    // res.json({
    //   success: true,
    //   data: notifications.rows,
    //   pagination: {
    //     total: notifications.count,
    //     page: parseInt(page),
    //     pages: Math.ceil(notifications.count / parseInt(limit))
    //   }
    // });

  } catch (error) {
    next(error);
  }
};

// @desc    Đánh dấu đã đọc
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    if (notification.MaNguoiDung !== req.user.MaNguoiDung) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền'
      });
    }

    await notification.update({ TrangThaiDoc: 1 });

    res.json({
      success: true,
      message: 'Đã đánh dấu đọc'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Đánh dấu tất cả đã đọc
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { TrangThaiDoc: 1 },
      { where: { MaNguoiDung: req.user.MaNguoiDung, TrangThaiDoc: 0 } }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả là đã đọc'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Tạo thông báo (Helper function)
const createNotification = async (userId, content, type) => {
  try {
    await Notification.create({
      MaNguoiDung: userId,
      NoiDung: content,
      LoaiThongBao: type
    });
    console.log('✅ Notification created for user:', userId);
  } catch (error) {
    console.error('❌ Create notification error:', error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};