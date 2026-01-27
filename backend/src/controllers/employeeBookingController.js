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
    const employeeId = req.user?.MaNhanVien || null;
    
    console.log('❌ Cancelling booking:', bookingId);

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

    // ===== CHỈ CHẶN ĐƠN ĐÃ HỦY =====
    // CHỈ CHẶN ĐƠN ĐÃ HỦY
if (booking.TrangThaiTT === 6) {
  await transaction.rollback();
  return res.status(400).json({
    success: false,
    message: 'Đơn đã bị hủy trước đó'
  });
}

    // Lấy danh sách vé chưa bị hủy trong đơn
    const tickets = await sequelize.query(
      'SELECT * FROM ChiTietVe WHERE MaDon = ? AND TrangThaiVe != 2',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    // Hủy đơn
    await sequelize.query(
      'UPDATE DonDatVe SET TrangThaiTT = 6 WHERE MaDon = ?',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    // Hủy tất cả vé chưa bị hủy
    await sequelize.query(
      'UPDATE ChiTietVe SET TrangThaiVe = 2 WHERE MaDon = ? AND TrangThaiVe != 2',
      {
        replacements: [bookingId],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    // ===== TẠO GIAO DỊCH HOÀN TIỀN =====
    let totalRefund = 0;
    if (booking.TrangThaiTT === 1) { // Nếu đơn đã duyệt
      for (const ticket of tickets) {
        const [existingRefund] = await sequelize.query(
          'SELECT * FROM GiaoDichHoanTien WHERE MaVe = ?',
          {
            replacements: [ticket.MaVe],
            type: sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (!existingRefund) {
          await sequelize.query(
            `INSERT INTO GiaoDichHoanTien 
             (MaVe, SoTienHoan, TrangThai, GhiChu, NhanVienXuLy_ID) 
             VALUES (?, ?, ?, ?, ?)`,
            {
              replacements: [
                ticket.MaVe,
                ticket.GiaVe,
                1,
                `Hoàn tiền do hủy đơn ${booking.MaBooking} bởi nhân viên`,
                employeeId
              ],
              type: sequelize.QueryTypes.INSERT,
              transaction
            }
          );
          totalRefund += parseFloat(ticket.GiaVe);
        }
      }
    }

    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    try {
      const { default: Notification } = await import('../models/Notification.js');
      
      if (totalRefund > 0) {
        await Notification.create({
          MaNguoiDung: booking.MaNguoiDung,
          NoiDung: `💰 Đơn vé ${booking.MaBooking} đã bị hủy. Số tiền ${totalRefund.toLocaleString('vi-VN')}đ đã được hoàn vào tài khoản của bạn.`,
          LoaiThongBao: 'BOOKING_CANCELLED_REFUND'
        });
      } else {
        await Notification.create({
          MaNguoiDung: booking.MaNguoiDung,
          NoiDung: `Đơn vé ${booking.MaBooking} đã bị hủy bởi nhân viên.`,
          LoaiThongBao: 'BOOKING_CANCELLED'
        });
      }
    } catch (notifError) {
      console.error('❌ Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      data: {
        bookingId: bookingId,
        ticketsCancelled: tickets.length,
        totalRefund: totalRefund
      }
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

// ===== THÊM CÁC FUNCTION MỚI =====

// @desc    Lấy danh sách chuyến xe theo ngày
// @route   GET /api/employee/trips
// @access  Private (Employee, Admin)
const getTrips = async (req, res, next) => {
  try {
    const { date } = req.query;

    console.log('🔍 Getting trips for date:', date);

    let whereClause = 'WHERE 1=1';
    let replacements = [];

    if (date) {
      whereClause += ' AND DATE(cx.ThoiGianKhoiHanh) = ?';
      replacements.push(date);
    }

    const trips = await sequelize.query(
      `SELECT 
        cx.MaChuyen,
        cx.ThoiGianKhoiHanh,
        cx.ThoiGianDuKienDen,
        CONCAT(dd1.TenDiaDiem, ' - ', dd2.TenDiaDiem) AS TenTuyen,
        dd1.TenDiaDiem AS DiemDi,
        dd2.TenDiaDiem AS DiemDen,
        td.KhoangCach,
        x.BienSoXe,
        x.LoaiXe,
        x.SoLuongGhe,
        nd.HoTen AS TenTaiXe,
        nd.SDT AS SDTTaiXe,
        (SELECT COUNT(*) FROM ChiTietVe cv 
         WHERE cv.MaChuyen = cx.MaChuyen AND cv.TrangThaiVe = 1) AS SoKhachDaDuyet,
        (SELECT COUNT(*) FROM ChiTietVe cv 
         INNER JOIN DonDatVe ddv ON cv.MaDon = ddv.MaDon
         WHERE cv.MaChuyen = cx.MaChuyen AND cv.TrangThaiVe = 0 AND ddv.TrangThaiTT = 2) AS SoKhachChoXuLy
      FROM ChuyenXe cx
      JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
      JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
      JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
      JOIN Xe x ON cx.BienSoXe = x.BienSoXe
      LEFT JOIN NguoiDung nd ON cx.MaTaiXe = nd.MaNguoiDung
      ${whereClause}
      ORDER BY cx.ThoiGianKhoiHanh ASC`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: trips
    });

  } catch (error) {
    console.error('❌ Error getting trips:', error);
    next(error);
  }
};

// @desc    Lấy chi tiết chuyến xe + danh sách đơn vé
// @route   GET /api/employee/trips/:id
// @access  Private (Employee, Admin)
const getTripDetail = async (req, res, next) => {
  try {
    const { id: tripId } = req.params;

    console.log('🔍 Getting trip detail:', tripId);

    const [trip] = await sequelize.query(
      `SELECT 
        cx.MaChuyen,
        cx.ThoiGianKhoiHanh,
        cx.ThoiGianDuKienDen,
        td.MaTuyen,
        CONCAT(dd1.TenDiaDiem, ' - ', dd2.TenDiaDiem) AS TenTuyen,
        dd1.TenDiaDiem AS DiemDi,
        dd2.TenDiaDiem AS DiemDen,
        td.KhoangCach,
        td.ThoiGianDuKien,
        td.GiaCoBan,
        x.BienSoXe,
        x.LoaiXe,
        x.SoLuongGhe,
        nd.HoTen AS TenTaiXe,
        nd.SDT AS SDTTaiXe,
        nd.Email AS EmailTaiXe
      FROM ChuyenXe cx
      JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
      JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
      JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
      JOIN Xe x ON cx.BienSoXe = x.BienSoXe
      LEFT JOIN NguoiDung nd ON cx.MaTaiXe = nd.MaNguoiDung
      WHERE cx.MaChuyen = ?`,
      {
        replacements: [tripId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    // ===== HIỆN CẢ ĐƠN CHỜ DUYỆT VÀ ĐÃ DUYỆT =====
    const bookings = await sequelize.query(
      `SELECT 
        ddv.MaDon,
        ddv.MaNguoiDung,
        ddv.NgayDat,
        ddv.TongTien,
        ddv.GhiChuKhachHang,
        ddv.TrangThaiTT,
        ddv.MaBooking,
        u.HoTen AS NguoiDat,
        u.Email,
        u.SDT,
        GROUP_CONCAT(DISTINCT cv.MaVe ORDER BY cv.MaVe) AS DanhSachVe,
        GROUP_CONCAT(DISTINCT cv.MaGhe ORDER BY cv.MaGhe) AS DanhSachGhe,
        GROUP_CONCAT(DISTINCT cv.TenHanhKhach ORDER BY cv.MaGhe SEPARATOR ' | ') AS DanhSachTenKhach,
        GROUP_CONCAT(DISTINCT cv.TrangThaiVe ORDER BY cv.MaGhe) AS DanhSachTrangThaiVe,
        COUNT(cv.MaVe) AS SoVe
      FROM DonDatVe ddv
      JOIN NguoiDung u ON ddv.MaNguoiDung = u.MaNguoiDung
      JOIN ChiTietVe cv ON ddv.MaDon = cv.MaDon
      WHERE cv.MaChuyen = ? AND ddv.TrangThaiTT IN (1, 2)
      GROUP BY ddv.MaDon
      ORDER BY ddv.TrangThaiTT ASC, ddv.NgayDat DESC`,
      {
        replacements: [tripId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const formattedBookings = bookings.map(booking => {
      const veArray = booking.DanhSachVe ? booking.DanhSachVe.split(',') : [];
      const gheArray = booking.DanhSachGhe ? booking.DanhSachGhe.split(',') : [];
      const tenArray = booking.DanhSachTenKhach ? booking.DanhSachTenKhach.split(' | ') : [];
      const trangThaiArray = booking.DanhSachTrangThaiVe ? booking.DanhSachTrangThaiVe.split(',').map(Number) : [];
      
      return {
        ...booking,
        DanhSachVe: veArray,
        DanhSachGhe: gheArray,
        DanhSachTenKhach: tenArray,
        DanhSachTrangThaiVe: trangThaiArray
      };
    });

    trip.bookings = formattedBookings;

    res.json({
      success: true,
      data: trip
    });

  } catch (error) {
    console.error('❌ Error getting trip detail:', error);
    next(error);
  }
};
// @desc    Lấy thông tin in danh sách khách
// @route   GET /api/employee/trips/:id/print
// @access  Private (Employee, Admin)
const getPrintInfo = async (req, res, next) => {
  try {
    const { id: tripId } = req.params;

    console.log('🖨️ Getting print info for trip:', tripId);

    const [trip] = await sequelize.query(
      `SELECT 
        cx.MaChuyen,
        cx.ThoiGianKhoiHanh,
        cx.ThoiGianDuKienDen,
        CONCAT(dd1.TenDiaDiem, ' - ', dd2.TenDiaDiem) AS TenTuyen,
        dd1.TenDiaDiem AS DiemDi,
        dd2.TenDiaDiem AS DiemDen,
        td.KhoangCach,
        x.BienSoXe,
        x.LoaiXe,
        x.SoLuongGhe,
        nd.HoTen AS TenTaiXe,
        nd.SDT AS SDTTaiXe
      FROM ChuyenXe cx
      JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
      JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
      JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
      JOIN Xe x ON cx.BienSoXe = x.BienSoXe
      LEFT JOIN NguoiDung nd ON cx.MaTaiXe = nd.MaNguoiDung
      WHERE cx.MaChuyen = ?`,
      {
        replacements: [tripId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    const passengers = await sequelize.query(
      `SELECT 
        cv.MaVe,
        cv.MaGhe,
        cv.TenHanhKhach,
        cv.SDT,
        cv.DiemDonChiTiet,
        cv.DiemTraChiTiet,
        cv.GiaVe
      FROM ChiTietVe cv
      WHERE cv.MaChuyen = ? AND cv.TrangThaiVe = 1
      ORDER BY cv.MaGhe ASC`,
      {
        replacements: [tripId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const totalRevenue = passengers.reduce((sum, p) => sum + parseFloat(p.GiaVe), 0);

    trip.passengers = passengers;
    trip.totalPassengers = passengers.length;
    trip.totalRevenue = totalRevenue;

    res.json({
      success: true,
      data: trip
    });

  } catch (error) {
    console.error('❌ Error getting print info:', error);
    next(error);
  }
};

// ===== CẬP NHẬT MODULE.EXPORTS =====
module.exports = {
  getAllBookings,
  getBookingDetail,
  approvePayment,
  cancelBooking,
  cancelTicket,
  updateTicketStatus,
  getTrips,          // ← THÊM
  getTripDetail,     // ← THÊM
  getPrintInfo       // ← THÊM
};