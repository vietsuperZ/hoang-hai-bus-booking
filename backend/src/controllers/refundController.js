// File: backend/src/controllers/refundController.js

const RefundTransaction = require('../models/RefundTransaction');
const { Ticket, Booking, User } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Lấy danh sách yêu cầu hoàn tiền
// @route   GET /api/employee/refunds
// @access  Private/Employee
const getAllRefunds = async (req, res, next) => {
  try {
    const { status } = req.query; // 0=Chờ xử lý, 1=Đã hoàn
    
    const whereCondition = {};
    if (status !== undefined) {
      whereCondition.TrangThai = parseInt(status);
    }

    const refunds = await RefundTransaction.findAll({
      where: whereCondition,
      include: [
        {
          model: Ticket,
          as: 'ticket',
          include: [
            {
              model: Booking,
              as: 'booking',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
                }
              ]
            }
          ]
        }
      ],
      order: [['NgayHoanTien', 'DESC']]
    });

    res.json({
      success: true,
      count: refunds.length,
      data: refunds
    });

  } catch (error) {
    console.error('❌ Get refunds error:', error);
    next(error);
  }
};

// @desc    Xử lý hoàn tiền
// @route   PUT /api/employee/refunds/:id/process
// @access  Private/Employee
const processRefund = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const refundId = req.params.id;
    const employeeId = req.user.employeeId; // Lấy từ token

    const refund = await RefundTransaction.findByPk(refundId, { transaction });

    if (!refund) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoàn tiền'
      });
    }

    if (refund.TrangThai === 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu đã được xử lý trước đó'
      });
    }

    // Cập nhật trạng thái
    await refund.update({
      TrangThai: 1, // Đã hoàn
      NhanVienXuLy_ID: employeeId,
      NgayHoanTien: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Đã xác nhận hoàn tiền thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Process refund error:', error);
    next(error);
  }
};

module.exports = {
  getAllRefunds,
  processRefund
};