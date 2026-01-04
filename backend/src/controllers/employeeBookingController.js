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

// @desc    Hủy đơn hàng
// @route   PUT /api/employee/bookings/:id/cancel
// @access  Private/Employee
const cancelBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const bookingId = req.params.id;
    const { lyDoHuy } = req.body; // Optional: Lý do hủy
    
    console.log('❌ Cancelling booking:', bookingId);

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Ticket,
          as: 'tickets'
        }
      ],
      transaction
    });

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
        message: 'Chỉ có thể hủy đơn đang chờ duyệt'
      });
    }

    // Cập nhật trạng thái đơn hàng
    await booking.update({
      TrangThaiTT: 3, // Đã hủy/Hoàn tiền
      GhiChu: lyDoHuy || 'Đơn hàng bị hủy bởi nhân viên'
    }, { transaction });

    // Hủy tất cả vé trong đơn
    if (booking.tickets && booking.tickets.length > 0) {
      await Ticket.update(
        { TrangThaiVe: 2 }, // 2 = Đã hủy
        {
          where: { MaDon: bookingId },
          transaction
        }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error cancelling booking:', error);
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

// @desc    Hủy vé đơn lẻ
// @route   PUT /api/employee/tickets/:id/cancel
// @access  Private/Employee
const cancelTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const ticketId = req.params.id;
    
    console.log('❌ Cancelling ticket:', ticketId);

    const ticket = await Ticket.findByPk(ticketId, {
      include: [
        {
          model: Booking,
          as: 'booking'
        }
      ],
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé'
      });
    }

    // Kiểm tra đơn hàng phải đang chờ duyệt
    if (ticket.booking && ticket.booking.TrangThaiTT !== 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy vé của đơn đang chờ duyệt'
      });
    }

    // Kiểm tra vé chưa bị hủy
    if (ticket.TrangThaiVe === 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vé đã bị hủy trước đó'
      });
    }

    // Hủy vé
    await ticket.update({
      TrangThaiVe: 2 // Đã hủy
    }, { transaction });

    // Cập nhật lại tổng tiền đơn hàng
    const remainingTickets = await Ticket.findAll({
      where: {
        MaDon: ticket.MaDon,
        TrangThaiVe: { [sequelize.Op.ne]: 2 } // Không bị hủy
      },
      transaction
    });

    const newTotal = remainingTickets.reduce((sum, t) => sum + parseFloat(t.GiaVe || 0), 0);

    await Booking.update(
      { TongTien: newTotal },
      {
        where: { MaDon: ticket.MaDon },
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Đã hủy vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error cancelling ticket:', error);
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  cancelBooking, // ← ĐỔI TÊN
  cancelTicket, // ← THÊM MỚI
  updateTicketStatus
};