const { Booking, Ticket, Trip, Route, Location, PaymentMethod, User } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Lấy danh sách đơn vé
// @route   GET /api/employee/bookings
// @access  Private/Employee
const getAllBookings = async (req, res, next) => {
  try {
    console.log('📋 Employee fetching bookings...');

    const bookings = await Booking.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['MaPTTT', 'TenPTTT']
        },
        {
          model: Ticket,
          as: 'tickets'
        }
      ],
      order: [['NgayDat', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    next(error);
  }
};

// @desc    Lấy chi tiết đơn vé
// @route   GET /api/employee/bookings/:id
// @access  Private/Employee
const getBookingDetail = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    
    console.log('📋 Fetching booking detail:', bookingId);

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['MaPTTT', 'TenPTTT']
        },
        {
          model: Ticket,
          as: 'tickets',
          include: [
            {
              model: Trip,
              as: 'trip',
              include: [
                {
                  model: Route,
                  as: 'route',
                  include: [
                    {
                      model: Location,
                      as: 'diemDi',
                      attributes: ['MaDiaDiem', 'TenDiaDiem']
                    },
                    {
                      model: Location,
                      as: 'diemDen',
                      attributes: ['MaDiaDiem', 'TenDiaDiem']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn vé'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('❌ Error fetching booking detail:', error);
    next(error);
  }
};

// @desc    Duyệt thanh toán
// @route   PUT /api/employee/bookings/:id/approve
// @access  Private/Employee
const approvePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const bookingId = req.params.id;
    
    console.log('✅ Approving payment:', bookingId);

    const booking = await Booking.findByPk(bookingId, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn vé'
      });
    }

    if (booking.TrangThaiTT !== 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể duyệt đơn đang chờ duyệt'
      });
    }

    // Cập nhật trạng thái
    await booking.update({
      TrangThaiTT: 1, // Đã thanh toán
      NgayThanhToan: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Duyệt thanh toán thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error approving payment:', error);
    next(error);
  }
};

// @desc    Cập nhật trạng thái vé
// @route   PUT /api/employee/tickets/:id/status
// @access  Private/Employee
const updateTicketStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const ticketId = req.params.id;
    const { TrangThaiVe } = req.body;

    console.log('🎫 Updating ticket status:', ticketId, 'to', TrangThaiVe);

    // Validate
    if (TrangThaiVe !== 0 && TrangThaiVe !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (0=Chưa sử dụng, 1=Đã sử dụng)'
      });
    }

    const ticket = await Ticket.findByPk(ticketId, { transaction });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé'
      });
    }

    await ticket.update({ TrangThaiVe }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating ticket status:', error);
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  updateTicketStatus
};