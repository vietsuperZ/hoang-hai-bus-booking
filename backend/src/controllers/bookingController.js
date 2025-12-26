const { Booking, Ticket, Trip, Route, Location, Bus, PaymentMethod, User } = require('../models');
const { generateUniqueBookingCode } = require('../utils/generateBookingCode');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

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

    // Kiểm tra ghế đã được đặt chưa (CHỈ kiểm tra ghế chưa hủy)
    const seatCodes = seats.map(s => s.MaGhe);
    const bookedSeats = await Ticket.findAll({
      where: {
        MaChuyen,
        MaGhe: { [Op.in]: seatCodes },
        TrangThaiVe: { [Op.in]: [0, 1] } // CHỈ kiểm tra: Đang giữ hoặc Đã thanh toán (KHÔNG bao gồm đã hủy = 2)
      },
      transaction
    });

    if (bookedSeats.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Một số ghế đã được đặt',
        bookedSeats: bookedSeats.map(s => s.MaGhe)
      });
    }

    // Tính tổng tiền
    const totalAmount = seats.length * trip.route.GiaCoBan;

    // Tạo mã booking
    const bookingCode = await generateUniqueBookingCode(Booking);

    // Tạo đơn đặt vé
    const booking = await Booking.create({
      MaNguoiDung,
      TongTien: totalAmount,
      GhiChuKhachHang,
      MaPTTT,
      TrangThaiTT: 0, // Chưa thanh toán
      MaBooking: bookingCode
    }, { transaction });

    // Tạo các vé
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
        TrangThaiVe: 0 // Đang giữ chỗ
      }, { transaction })
    );

    await Promise.all(ticketPromises);

    await transaction.commit();

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
    next(error);
  }
};

// @desc    Lấy lịch sử đặt vé của user (KHÔNG bao gồm vé đã hủy hoàn toàn)
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

// @desc    Lấy chi tiết đơn đặt vé
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
        { model: PaymentMethod, as: 'paymentMethod' }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    // Kiểm tra quyền truy cập
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
    const booking = await Booking.findByPk(req.params.id, { transaction });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé'
      });
    }

    // Kiểm tra quyền hủy
    if (booking.MaNguoiDung !== req.user.MaNguoiDung) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn này'
      });
    }

    // Kiểm tra đã thanh toán chưa
    if (booking.TrangThaiTT === 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn đã thanh toán. Vui lòng liên hệ nhân viên để hoàn tiền'
      });
    }

    // XÓA HẲN VÉ ĐÃ HỦY để giải phóng ghế
    await Ticket.destroy({
      where: { MaDon: booking.MaDon },
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Hủy đơn đặt vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Duyệt vé (Employee/Admin)
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

    // Cập nhật trạng thái thanh toán
    await booking.update({ TrangThaiTT: 1 }, { transaction });

    // Cập nhật trạng thái vé
    await Ticket.update(
      { TrangThaiVe: 1 }, // Đã thanh toán
      { where: { MaDon: booking.MaDon }, transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Duyệt vé thành công'
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// @desc    Lấy tất cả đơn đặt vé (Employee/Admin)
// @route   GET /api/bookings
// @access  Private/Employee/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    
    const whereCondition = {};
    if (status) {
      whereCondition.TrangThaiTT = status;
    }

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
        { model: User, as: 'user', attributes: ['HoTen', 'Email', 'SDT'] }
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

// @desc    Webhook từ Casso khi có giao dịch
// @route   POST /api/bookings/casso-webhook
// @access  Public (nhưng verify bằng secret key)
const cassoWebhook = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('📥 Casso Webhook received:', req.body);
    
    const { data, error } = req.body;
    
    if (error) {
      return res.status(200).json({ success: true }); // Vẫn trả 200 để Casso không retry
    }

    // Duyệt qua các giao dịch
    for (const txn of data) {
      const { 
        amount,           // Số tiền
        description,      // Nội dung chuyển khoản
        when,            // Thời gian
        transaction_id   // Mã giao dịch ngân hàng
      } = txn;

      // Tìm mã booking trong nội dung (format: HH123456)
      const bookingCodeMatch = description.match(/HH\d{6}/i);
      
      if (!bookingCodeMatch) {
        console.log('❌ Không tìm thấy mã booking:', description);
        continue;
      }

      const bookingCode = bookingCodeMatch[0].toUpperCase();
      console.log('🔍 Tìm thấy mã booking:', bookingCode);

      // Tìm booking
      const booking = await Booking.findOne({
        where: { MaBooking: bookingCode },
        transaction
      });

      if (!booking) {
        console.log('❌ Không tìm thấy booking:', bookingCode);
        continue;
      }

      // Kiểm tra đã thanh toán chưa
      if (booking.TrangThaiTT === 1) {
        console.log('⚠️ Booking đã được thanh toán:', bookingCode);
        continue;
      }

      // Kiểm tra số tiền (cho phép sai số 1000đ)
      if (amount < booking.TongTien - 1000) {
        console.log('❌ Số tiền không đủ:', amount, 'cần:', booking.TongTien);
        continue;
      }

      console.log('✅ Xác nhận thanh toán:', bookingCode);

      // Cập nhật trạng thái
      await booking.update({ 
        TrangThaiTT: 1,
        NgayThanhToan: new Date(when)
      }, { transaction });

      // Cập nhật vé
      await Ticket.update(
        { TrangThaiVe: 1 },
        { where: { MaDon: booking.MaDon }, transaction }
      );

      // TODO: Gửi email xác nhận
      // await sendConfirmationEmail(booking);

      console.log('💚 Thanh toán thành công:', bookingCode);
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Webhook error:', error);
    
    // Vẫn trả 200 để Casso không retry liên tục
    res.status(200).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Kiểm tra trạng thái thanh toán
// @route   POST /api/bookings/check-payment
// @access  Private
const checkPaymentStatus = async (req, res, next) => {
  try {
    const { bookingCode } = req.body;

    const booking = await Booking.findOne({
      where: { MaBooking: bookingCode }
    });

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



module.exports = {
  cassoWebhook,
  checkPaymentStatus,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  approveBooking,
  getAllBookings
};