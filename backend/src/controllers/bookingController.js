const { Booking, Ticket, Trip, Route, Location, Bus, PaymentMethod, User } = require('../models');
const RefundTransaction = require('../models/RefundTransaction');
const { generateUniqueBookingCode } = require('../utils/generateBookingCode');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// ===== HELPER FUNCTION TẠO THÔNG BÁO =====
const createNotification = async (userId, content, type) => {
  try {
    const { default: Notification } = await import('../models/Notification.js');
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

// @desc    Tạo đơn đặt vé
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { MaChuyen, seats, MaPTTT, GhiChuKhachHang } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    // Validate input
    if (!MaChuyen || !seats || seats.length === 0 || !MaPTTT) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Kiểm tra chuyến xe tồn tại
    const trip = await Trip.findByPk(MaChuyen, {
      include: [
        { model: Route, as: 'route' },
        { model: Bus, as: 'bus' }
      ]
    });

    if (!trip) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    // ============================================
    // ✅ XỬ LÝ VÉ ĐÃ HỦY
    // ============================================
    
    const seatCodes = seats.map(s => s.MaGhe);
    
    // 1. Kiểm tra ghế đã được đặt (CHỈ check vé chưa hủy)
    const bookedSeats = await Ticket.findAll({
      where: {
        MaChuyen,
        MaGhe: { [Op.in]: seatCodes },
        TrangThaiVe: { [Op.in]: [0, 1] } // Chỉ check: Chưa sử dụng hoặc Đã thanh toán
      },
      attributes: ['MaGhe', 'TrangThaiVe'],
      transaction
    });

    if (bookedSeats.length > 0) {
      await transaction.rollback();
      const bookedList = bookedSeats.map(s => s.MaGhe).join(', ');
      return res.status(400).json({
        success: false,
        message: `Các ghế sau đã được đặt: ${bookedList}`,
        bookedSeats: bookedSeats.map(s => s.MaGhe)
      });
    }

    // 2. Tìm và XÓA vé đã hủy (TrangThaiVe = 2)
    const canceledSeats = await Ticket.findAll({
      where: {
        MaChuyen,
        MaGhe: { [Op.in]: seatCodes },
        TrangThaiVe: 2 // Đã hủy
      },
      attributes: ['MaVe', 'MaGhe'],
      transaction
    });

    if (canceledSeats.length > 0) {
      // Xóa vé đã hủy để cho phép đặt lại
      const canceledVeIds = canceledSeats.map(s => s.MaVe);
      
      await Ticket.destroy({
        where: {
          MaVe: { [Op.in]: canceledVeIds }
        },
        transaction
      });
      
      console.log(`🗑️ Đã xóa ${canceledSeats.length} vé đã hủy:`, canceledSeats.map(s => s.MaGhe));
    }

    // ============================================
    // TIẾP TỤC TẠO ĐƠN MỚI
    // ============================================

    // Tính tổng tiền
    const totalAmount = seats.length * trip.route.GiaCoBan;

    // Tạo mã booking
    const bookingCode = await generateUniqueBookingCode(Booking);

    // Tạo đơn đặt vé (Trạng thái 2: Chờ duyệt)
    const booking = await Booking.create({
      MaNguoiDung,
      TongTien: totalAmount,
      GhiChuKhachHang,
      MaPTTT,
      TrangThaiTT: 2, // Chờ duyệt
      NgayThanhToan: new Date(),
      MaBooking: bookingCode
    }, { transaction });

    // Tạo các vé (TrangThaiVe = 0: Chưa sử dụng)
    const ticketPromises = seats.map(seat => 
      Ticket.create({
        MaDon: booking.MaDon,
        MaChuyen,
        MaGhe: seat.MaGhe,
        GiaVe: trip.route.GiaCoBan,
        DiemDonChiTiet: seat.DiemDonChiTiet,
        DiemTraChiTiet: seat.DiemTraChiTiet,
        TenHanhKhach: seat.TenHanhKhach,
        SDT: seat.SDT,
        TrangThaiVe: 0 // Chưa sử dụng
      }, { transaction })
    );

    await Promise.all(ticketPromises);

    await transaction.commit();

    // Gửi thông báo
    await createNotification(
      MaNguoiDung,
      `Đặt vé ${bookingCode} thành công! Vui lòng chờ nhân viên xác nhận đơn hàng.`,
      'BOOKING_CREATED'
    );

    // Lấy thông tin đầy đủ
    const bookingWithDetails = await Booking.findByPk(booking.MaDon, {
      include: [
        {
          model: Ticket,
          as: 'tickets',
          include: [{
            model: Trip,
            as: 'trip',
            include: [
              {
                model: Route,
                as: 'route',
                include: [
                  { model: Location, as: 'diemDi' },
                  { model: Location, as: 'diemDen' }
                ]
              },
              { model: Bus, as: 'bus' }
            ]
          }]
        },
        { model: PaymentMethod, as: 'paymentMethod' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Đặt vé thành công',
      data: bookingWithDetails
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating booking:', error);
    next(error);
  }
};
// @desc    Hoàn tiền
// @route   PUT /api/bookings/:id/complete-refund
// @access  Private/Employee
const completeRefund = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'tickets' }],
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    if (booking.TrangThaiTT !== 4) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn không ở trạng thái chờ hoàn tiền'
      });
    }

    const ticketIds = booking.tickets.map(t => t.MaVe);

    await RefundTransaction.update(
      { TrangThai: 1, NgayHoanTien: new Date() },
      { where: { MaVe: { [Op.in]: ticketIds } }, transaction }
    );

    await Ticket.destroy({
      where: { MaDon: booking.MaDon },
      transaction
    });

    await booking.update({ TrangThaiTT: 5 }, { transaction });
    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    await createNotification(
      booking.MaNguoiDung,
      `💰 Đơn vé ${booking.MaBooking} đã được hoàn tiền thành công. Số tiền ${booking.TongTien.toLocaleString('vi-VN')}đ sẽ về tài khoản trong 1-3 ngày làm việc.`,
      'REFUND_COMPLETED'
    );

    res.status(200).json({
      success: true,
      message: 'Đã hoàn tiền thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Complete refund error:', error);
    next(error);
  }
};

// @desc    Lấy lịch sử đặt vé
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { MaNguoiDung: req.user.MaNguoiDung },
      include: [
        {
          model: Ticket,
          as: 'tickets',
          include: [{
            model: Trip,
            as: 'trip',
            include: [
              {
                model: Route,
                as: 'route',
                include: [
                  { model: Location, as: 'diemDi' },
                  { model: Location, as: 'diemDen' }
                ]
              },
              { model: Bus, as: 'bus' }
            ]
          }]
        },
        { model: PaymentMethod, as: 'paymentMethod' }
      ],
      order: [['NgayDat', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết đơn
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Ticket,
          as: 'tickets',
          include: [{
            model: Trip,
            as: 'trip',
            include: [
              {
                model: Route,
                as: 'route',
                include: [
                  { model: Location, as: 'diemDi' },
                  { model: Location, as: 'diemDen' }
                ]
              },
              { model: Bus, as: 'bus' }
            ]
          }]
        },
        { model: PaymentMethod, as: 'paymentMethod' },
        { model: User, as: 'user', attributes: ['HoTen', 'Email', 'SDT'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    if (booking.MaNguoiDung !== req.user.MaNguoiDung && !req.user.roles.find(r => ['Admin', 'Nhân viên'].includes(r.TenVaiTro))) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn này'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hủy đơn đặt vé
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Ticket,
        as: 'tickets',
        include: [{ model: Trip, as: 'trip' }]
      }],
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    if (booking.MaNguoiDung !== req.user.MaNguoiDung) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn này'
      });
    }

    if ([3, 4, 5, 6].includes(booking.TrangThaiTT)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn đã được yêu cầu hủy hoặc đã hủy'
      });
    }

    const departureTime = booking.tickets?.[0]?.trip?.ThoiGianKhoiHanh;
    if (departureTime) {
      const now = new Date();
      const departure = new Date(departureTime);
      const hoursDiff = (departure - now) / (1000 * 60 * 60);
      
      if (hoursDiff < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy vé sau khi xe đã khởi hành'
        });
      }
      
      if (hoursDiff < 24) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy vé trong vòng 24 giờ trước giờ khởi hành'
        });
      }
    }

    const wasAlreadyPaid = (booking.TrangThaiTT === 1 || booking.NgayThanhToan);
    const newStatus = wasAlreadyPaid ? 3 : 6;
    
    await booking.update({ TrangThaiTT: newStatus }, { transaction });

    if (!wasAlreadyPaid) {
      await Ticket.update(
        { TrangThaiVe: 2 },
        { where: { MaDon: booking.MaDon }, transaction }
      );
    }

    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    const message = wasAlreadyPaid
      ? `⚠️ Yêu cầu hủy vé ${booking.MaBooking} đã được gửi. Vui lòng chờ nhân viên xác nhận để hoàn tiền.`
      : `❌ Đơn vé ${booking.MaBooking} đã được hủy thành công.`;

    await createNotification(
      booking.MaNguoiDung,
      message,
      wasAlreadyPaid ? 'BOOKING_CANCEL_REQUESTED' : 'BOOKING_CANCELLED'
    );

    res.status(200).json({
      success: true,
      message: wasAlreadyPaid
        ? 'Đã gửi yêu cầu hủy vé. Vui lòng chờ nhân viên xác nhận.'
        : 'Đã hủy đơn đặt vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Cancel booking error:', error);
    next(error);
  }
};

// @desc    Duyệt hủy
// @route   PUT /api/bookings/:id/approve-cancel
// @access  Private/Employee
const approveCancellation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'tickets' }],
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    if (booking.TrangThaiTT !== 3) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn không ở trạng thái chờ duyệt hủy'
      });
    }

    // Kiểm tra đã tồn tại refund chưa
    const existingRefunds = await RefundTransaction.findAll({
      where: { MaVe: { [Op.in]: booking.tickets.map(t => t.MaVe) } },
      transaction
    });

    if (existingRefunds.length === 0) {
      // Tạo refund mới
      for (const ticket of booking.tickets) {
        await RefundTransaction.create({
          MaVe: ticket.MaVe,
          SoTienHoan: ticket.GiaVe,
          TrangThai: 0,
          GhiChu: `Yêu cầu hoàn tiền cho đơn ${booking.MaBooking}`
        }, { transaction });
      }
    }

    await booking.update({ TrangThaiTT: 4 }, { transaction });

    await Ticket.update(
      { TrangThaiVe: 2 },
      { where: { MaDon: booking.MaDon }, transaction }
    );

    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    await createNotification(
      booking.MaNguoiDung,
      `✅ Yêu cầu hủy vé ${booking.MaBooking} đã được duyệt. Tiền sẽ được hoàn trong 1-3 ngày làm việc.`,
      'CANCEL_APPROVED'
    );

    res.status(200).json({
      success: true,
      message: 'Đã duyệt yêu cầu hủy vé. Chờ xử lý hoàn tiền.'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Approve cancellation error:', error);
    next(error);
  }
};

// @desc    Duyệt vé
// @route   PUT /api/bookings/:id/approve
// @access  Private/Employee/Admin
const approveBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    await booking.update({ TrangThaiTT: 1, NgayThanhToan: new Date() }, { transaction });

    await Ticket.update(
      { TrangThaiVe: 1 },
      { where: { MaDon: booking.MaDon }, transaction }
    );

    await transaction.commit();

    // ===== GỬI THÔNG BÁO =====
    await createNotification(
      booking.MaNguoiDung,
      `✅ Đơn vé ${booking.MaBooking} đã được duyệt thanh toán. Vé của bạn đã sẵn sàng!`,
      'BOOKING_APPROVED'
    );

    res.status(200).json({
      success: true,
      message: 'Duyệt vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Lấy tất cả đơn
// @route   GET /api/bookings
// @access  Private/Employee/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    
    const whereCondition = {};
    if (status) whereCondition.TrangThaiTT = status;

    const bookings = await Booking.findAll({
      where: whereCondition,
      include: [
        {
          model: Ticket,
          as: 'tickets',
          include: [{
            model: Trip,
            as: 'trip',
            include: [{
              model: Route,
              as: 'route',
              include: [
                { model: Location, as: 'diemDi' },
                { model: Location, as: 'diemDen' }
              ]
            }]
          }]
        },
        { model: User, as: 'user', attributes: ['HoTen', 'Email', 'SDT'] },
        { model: PaymentMethod, as: 'paymentMethod' }
      ],
      order: [['NgayDat', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// Các function còn lại giữ nguyên...
const cassoWebhook = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('📥 Casso Webhook received:', req.body);
    
    const { data, error } = req.body;
    if (error) return res.status(200).json({ success: true });

    for (const txn of data) {
      const { amount, description, when } = txn;
      const bookingCodeMatch = description.match(/HH\d{6}/i);
      
      if (!bookingCodeMatch) continue;

      const bookingCode = bookingCodeMatch[0].toUpperCase();
      const booking = await Booking.findOne({
        where: { MaBooking: bookingCode },
        transaction
      });

      if (!booking || booking.TrangThaiTT === 1) continue;
      if (amount < booking.TongTien - 1000) continue;

      await booking.update({ 
        TrangThaiTT: 1,
        NgayThanhToan: new Date(when)
      }, { transaction });

      await Ticket.update(
        { TrangThaiVe: 1 },
        { where: { MaDon: booking.MaDon }, transaction }
      );

      // ===== GỬI THÔNG BÁO =====
      await createNotification(
        booking.MaNguoiDung,
        `✅ Thanh toán thành công cho đơn ${bookingCode}. Vé của bạn đã sẵn sàng!`,
        'PAYMENT_SUCCESS'
      );
    }

    await transaction.commit();
    res.status(200).json({ success: true });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Webhook error:', error);
    res.status(200).json({ success: false, error: error.message });
  }
};

const checkPaymentStatus = async (req, res, next) => {
  try {
    const { bookingCode } = req.body;
    const booking = await Booking.findOne({ where: { MaBooking: bookingCode } });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isPaid: booking.TrangThaiTT === 1,
        amount: booking.TongTien,
        paidAt: booking.NgayThanhToan
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin vé
// @route   PUT /api/bookings/ticket/:ticketId
// @access  Private
const updateTicketInfo = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ticketId } = req.params;
    const { TenHanhKhach, SDT, DiemDonChiTiet, DiemTraChiTiet } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    console.log('📝 Updating ticket info:', ticketId);

    // Lấy thông tin vé
    const [ticket] = await sequelize.query(
      `SELECT 
        cv.*,
        cx.ThoiGianKhoiHanh,
        ddv.MaNguoiDung,
        ddv.TrangThaiTT
       FROM ChiTietVe cv
       JOIN DonDatVe ddv ON cv.MaDon = ddv.MaDon
       JOIN ChuyenXe cx ON cv.MaChuyen = cx.MaChuyen
       WHERE cv.MaVe = ?`,
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

    // Check quyền sở hữu
    if (ticket.MaNguoiDung !== MaNguoiDung) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật vé này'
      });
    }

    // Check trạng thái vé
    if (ticket.TrangThaiVe !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật vé đã được duyệt'
      });
    }

    // Check trạng thái thanh toán
    if (ticket.TrangThaiTT !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật vé đã thanh toán'
      });
    }

    // Check thời gian (phải trước 24h)
    const departureTime = new Date(ticket.ThoiGianKhoiHanh);
    const now = new Date();
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 24) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật thông tin trước 24 giờ khởi hành'
      });
    }

    // Cập nhật thông tin
    await sequelize.query(
      `UPDATE ChiTietVe 
       SET TenHanhKhach = ?,
           SDT = ?,
           DiemDonChiTiet = ?,
           DiemTraChiTiet = ?
       WHERE MaVe = ?`,
      {
        replacements: [
          TenHanhKhach || ticket.TenHanhKhach,
          SDT || ticket.SDT,
          DiemDonChiTiet || ticket.DiemDonChiTiet,
          DiemTraChiTiet || ticket.DiemTraChiTiet,
          ticketId
        ],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật thông tin vé thành công!'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error updating ticket:', error);
    next(error);
  }
};


const autoApproveBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const booking = await Booking.findByPk(req.params.id, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    if (booking.MaNguoiDung !== req.user.MaNguoiDung) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Không có quyền'
      });
    }

    if (booking.TrangThaiTT !== 2) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn không ở trạng thái chờ duyệt'
      });
    }

    await booking.update({ 
      TrangThaiTT: 1,
      NgayThanhToan: new Date()
    }, { transaction });

    await Ticket.update(
      { TrangThaiVe: 0 },
      { where: { MaDon: booking.MaDon }, transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán thành công'
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  cassoWebhook,
  checkPaymentStatus,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  approveBooking,
  autoApproveBooking,
  completeRefund,
  approveCancellation,
  getAllBookings,
  updateTicketInfo
};