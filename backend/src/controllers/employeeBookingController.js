const { Booking, Ticket, Trip, Route, Location, PaymentMethod, User, Bus } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

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
          as: 'tickets',
          include: [
            {
              model: Trip,
              as: 'trip',
              attributes: ['MaChuyen', 'ThoiGianKhoiHanh', 'ThoiGianDuKienDen'],
              include: [
                {
                  model: Route,
                  as: 'route',
                  include: [
                    {
                      model: Location,
                      as: 'diemDi',
                      attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
                    },
                    {
                      model: Location,
                      as: 'diemDen',
                      attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
                    }
                  ]
                },
                {
                  model: Bus,
                  as: 'bus',
                  attributes: ['BienSoXe', 'LoaiXe'] // ← BỎ MaXe
                }
              ]
            }
          ]
        }
      ],
      order: [['NgayDat', 'DESC']]
    });

    console.log(`✅ Found ${bookings.length} bookings`);

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
                      attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
                    },
                    {
                      model: Location,
                      as: 'diemDen',
                      attributes: ['MaDiaDiem', 'TenDiaDiem', 'TenTinh']
                    }
                  ]
                },
                {
                  model: Bus,
                  as: 'bus',
                  attributes: ['BienSoXe', 'LoaiXe'] // ← BỎ MaXe
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

// Các functions còn lại giữ nguyên...
const approvePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const bookingId = parseInt(req.params.id);
    
    console.log('✅ Approving payment:', bookingId);

    const [booking] = await sequelize.query(
      'SELECT * FROM DonDatVe WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

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

    await sequelize.query(
      'UPDATE DonDatVe SET TrangThaiTT = 1 WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await sequelize.query(
      'UPDATE ChiTietVe SET TrangThaiVe = 1 WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    try {
      const { default: Notification } = await import('../models/Notification.js');
      await Notification.create({
        MaNguoiDung: booking.MaNguoiDung,
        NoiDung: `Đơn vé ${booking.MaBooking} đã được duyệt. Vé của bạn đã sẵn sàng!`,
        LoaiThongBao: 'BOOKING_APPROVED'
      });
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Duyệt thanh toán thành công'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error approving payment:', error);
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const bookingId = parseInt(req.params.id);
    
    const [booking] = await sequelize.query(
      'SELECT * FROM DonDatVe WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

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

    await sequelize.query(
      'UPDATE DonDatVe SET TrangThaiTT = 6 WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await sequelize.query(
      'UPDATE ChiTietVe SET TrangThaiVe = 2 WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    try {
      const { default: Notification } = await import('../models/Notification.js');
      await Notification.create({
        MaNguoiDung: booking.MaNguoiDung,
        NoiDung: `Đơn vé ${booking.MaBooking} đã bị hủy bởi nhân viên.`,
        LoaiThongBao: 'BOOKING_CANCELLED'
      });
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error cancelling booking:', error);
    next(error);
  }
};

const updateTicketStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const ticketId = req.params.id;
    const { TrangThaiVe } = req.body;

    if (TrangThaiVe !== 0 && TrangThaiVe !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    await sequelize.query(
      'UPDATE ChiTietVe SET TrangThaiVe = ? WHERE MaVe = ?',
      {
        replacements: [TrangThaiVe, ticketId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái vé thành công'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// @desc    Hủy vé đơn lẻ
// @route   PUT /api/employee/tickets/:id/cancel
// @access  Private/Employee
// @desc    Hủy vé đơn lẻ
// @route   PUT /api/employee/tickets/:id/cancel
// @access  Private/Employee
// @desc    Hủy vé đơn lẻ
// @route   PUT /api/employee/tickets/:id/cancel
// @access  Private/Employee
const cancelTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const ticketId = req.params.id;
    const employeeId = req.user?.MaNhanVien || null;

    console.log('❌ Cancelling ticket:', ticketId);

    const [ticket] = await sequelize.query(
      'SELECT * FROM ChiTietVe WHERE MaVe = ?',
      {
        replacements: [ticketId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé'
      });
    }

    if (ticket.TrangThaiVe === 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vé đã bị hủy'
      });
    }

    const [booking] = await sequelize.query(
      'SELECT * FROM DonDatVe WHERE MaDon = ?',
      {
        replacements: [ticket.MaDon],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Hủy vé
    await sequelize.query(
      'UPDATE ChiTietVe SET TrangThaiVe = 2 WHERE MaVe = ?',
      {
        replacements: [ticketId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    // Tính lại tổng tiền
    const [result] = await sequelize.query(
      'SELECT SUM(GiaVe) as total FROM ChiTietVe WHERE MaDon = ? AND TrangThaiVe != 2',
      {
        replacements: [ticket.MaDon],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    const newTotal = result.total || 0;
    
    console.log('💰 Old total:', booking.TongTien);
    console.log('💰 New total:', newTotal);

    // Cập nhật tổng tiền
    await sequelize.query(
      'UPDATE DonDatVe SET TongTien = ? WHERE MaDon = ?',
      {
        replacements: [newTotal, ticket.MaDon],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    // ===== TẠO GIAO DỊCH HOÀN TIỀN VÀ GỬI THÔNG BÁO =====
    let refundCreated = false;
    if (booking.TrangThaiTT === 1 || booking.TrangThaiTT === 2) {
      const [existingRefund] = await sequelize.query(
        'SELECT * FROM GiaoDichHoanTien WHERE MaVe = ?',
        {
          replacements: [ticketId],
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (!existingRefund) {
        // Tạo giao dịch hoàn tiền
        await sequelize.query(
          `INSERT INTO GiaoDichHoanTien 
           (MaVe, SoTienHoan, TrangThai, GhiChu, NhanVienXuLy_ID) 
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              ticketId,
              ticket.GiaVe,
              1, // ← TRẠNG THÁI 1 = ĐÃ HOÀN TIỀN LUÔN
              `Hoàn tiền vé bị hủy bởi nhân viên - Đơn ${booking.MaBooking}`,
              employeeId
            ],
            type: sequelize.QueryTypes.INSERT,
            transaction
          }
        );
        
        refundCreated = true;
        console.log('✅ Refund transaction created and completed');
      }
    }

    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    try {
      const { default: Notification } = await import('../models/Notification.js');
      
      if (refundCreated) {
        // Thông báo đã hoàn tiền
        await Notification.create({
          MaNguoiDung: booking.MaNguoiDung,
          NoiDung: `💰 Vé #${ticketId} trong đơn ${booking.MaBooking} đã bị hủy. Số tiền ${ticket.GiaVe.toLocaleString('vi-VN')}đ đã được hoàn vào tài khoản của bạn.`,
          LoaiThongBao: 'REFUND_COMPLETED'
        });
      } else {
        // Thông báo hủy vé thường
        await Notification.create({
          MaNguoiDung: booking.MaNguoiDung,
          NoiDung: `Vé #${ticketId} trong đơn ${booking.MaBooking} đã bị hủy bởi nhân viên.`,
          LoaiThongBao: 'TICKET_CANCELLED'
        });
      }
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Đã hủy vé thành công',
      data: {
        ticketId: ticketId,
        oldTotal: booking.TongTien,
        newTotal: newTotal,
        refundAmount: ticket.GiaVe,
        refundCreated: refundCreated
      }
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error cancelling ticket:', error);
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  cancelBooking,
  cancelTicket,
  updateTicketStatus
};