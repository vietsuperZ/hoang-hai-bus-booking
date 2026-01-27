const { now } = require('sequelize/lib/utils');
const { Trip, Route, Bus, Employee, Location, Ticket, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Tìm kiếm chuyến xe
// @route   GET /api/trips/search?diemDi=1&diemDen=2&ngayDi=2024-01-20
// @access  Public
const searchTrips = async (req, res, next) => {
  try {
    const { diemDi, diemDen, ngayDi } = req.query;

    if (!diemDi || !diemDen || !ngayDi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn điểm đi, điểm đến và ngày đi'
      });
    }

    // Tìm tuyến đường
    const routes = await Route.findAll({
      where: {
        DiemDi_ID: diemDi,
        DiemDen_ID: diemDen
      }
    });

    if (routes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường phù hợp'
      });
    }

    const routeIds = routes.map(r => r.MaTuyen);

    // Tìm chuyến xe trong ngày
    const startDate = new Date(ngayDi);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(ngayDi);
    endDate.setHours(23, 59, 59, 999);

    const trips = await Trip.findAll({
      where: {
        MaTuyen: { [Op.in]: routeIds },
        ThoiGianKhoiHanh: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Route,
          as: 'route',
          include: [
            { model: Location, as: 'diemDi' },
            { model: Location, as: 'diemDen' }
          ]
        },
        { model: Bus, as: 'bus' },
        { 
          model: Employee, 
          as: 'driver', 
          include: [{ model: User, as: 'user', attributes: ['HoTen', 'Email'] }] 
        }
      ],
      order: [['ThoiGianKhoiHanh', 'ASC']]
    });

    // Tính số ghế trống cho mỗi chuyến
    for (let trip of trips) {
      const bookedSeats = await Ticket.count({
        where: {
          MaChuyen: trip.MaChuyen,
          TrangThaiVe: { [Op.in]: [0, 1] } // Đang giữ chỗ hoặc đã thanh toán
        }
      });
      trip.dataValues.availableSeats = trip.bus.SoLuongGhe - bookedSeats;
    }

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách tất cả chuyến xe
// @route   GET /api/trips
// @access  Private/Admin
const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.findAll({
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
      ],
      order: [['ThoiGianKhoiHanh', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết chuyến xe
// @route   GET /api/trips/:id
// @access  Public
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [
        {
          model: Route,
          as: 'route',
          include: [
            { model: Location, as: 'diemDi' },
            { model: Location, as: 'diemDen' }
          ]
        },
        { model: Bus, as: 'bus' },
        { model: Employee, as: 'driver' },
        { model: Employee, as: 'assistant' }
      ]
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy sơ đồ ghế của chuyến
// @route   GET /api/trips/:id/seats
// @access  Public
const getTripSeats = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: [{ model: Bus, as: 'bus' }]
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    // Lấy danh sách ghế đã đặt
    const bookedTickets = await Ticket.findAll({
      where: {
        MaChuyen: trip.MaChuyen,
        TrangThaiVe: { [Op.in]: [0, 1] } // Đang giữ chỗ hoặc đã thanh toán
      },
      attributes: ['MaGhe', 'TrangThaiVe']
    });

    const bookedSeats = bookedTickets.map(t => ({
      seatCode: t.MaGhe,
      status: t.TrangThaiVe === 1 ? 'booked' : 'holding'
    }));
    
    res.status(200).json({
      success: true,
      data: {
        totalSeats: trip.bus.SoLuongGhe,
        busType: trip.bus.LoaiXe,
        bookedSeats: bookedSeats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo chuyến xe mới
// @route   POST /api/trips
// @access  Private/Admin
// @desc    Tạo chuyến xe mới
// @route   POST /api/trips
// @access  Private/Admin
const createTrip = async (req, res, next) => {
  try {
    const { MaTuyen, BienSoXe, ThoiGianKhoiHanh, ThoiGianDuKienDen, MaTaiXe, MaLoXe } = req.body;

    // ============================================
    // ✅ VALIDATION: Kiểm tra thời gian quá khứ
    // ============================================
    
    const departureTime = new Date(ThoiGianKhoiHanh);
    const arrivalTime = new Date(ThoiGianDuKienDen);
    const now = new Date();

    // 1. Kiểm tra thời gian khởi hành không được ở quá khứ
    if (departureTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian khởi hành không được ở quá khứ'
      });
    }

    // 2. Kiểm tra thời gian đến phải sau thời gian khởi hành
    if (arrivalTime <= departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian dự kiến đến phải sau thời gian khởi hành'
      });
    }

    // 3. Kiểm tra khoảng cách thời gian hợp lý (ít nhất 30 phút)
    const timeDiff = (arrivalTime - departureTime) / (1000 * 60); // phút
    if (timeDiff < 30) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian hành trình phải ít nhất 30 phút'
      });
    }

    // ============================================
    // VALIDATION: Kiểm tra tuyến, xe, tài xế
    // ============================================

    // 4. Kiểm tra tuyến tồn tại
    const route = await Route.findByPk(MaTuyen);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    // 5. Kiểm tra xe tồn tại
    const bus = await Bus.findByPk(BienSoXe);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy xe'
      });
    }

    // 6. Kiểm tra tài xế (nếu có)
    if (MaTaiXe) {
      const driver = await Employee.findByPk(MaTaiXe);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài xế'
        });
      }
    }

    // 7. Kiểm tra phụ xe (nếu có)
    if (MaLoXe) {
      const assistant = await Employee.findByPk(MaLoXe);
      if (!assistant) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phụ xe'
        });
      }
    }

    // ============================================
    // VALIDATION: Kiểm tra trùng lịch
    // ============================================

    // 8. Kiểm tra xe có bị trùng lịch không
    const conflictingTrips = await Trip.findAll({
      where: {
        BienSoXe,
        [Op.or]: [
          {
            // Chuyến mới bắt đầu trong khoảng thời gian của chuyến cũ
            ThoiGianKhoiHanh: {
              [Op.lte]: departureTime
            },
            ThoiGianDuKienDen: {
              [Op.gt]: departureTime
            }
          },
          {
            // Chuyến mới kết thúc trong khoảng thời gian của chuyến cũ
            ThoiGianKhoiHanh: {
              [Op.lt]: arrivalTime
            },
            ThoiGianDuKienDen: {
              [Op.gte]: arrivalTime
            }
          },
          {
            // Chuyến mới bao trùm chuyến cũ
            ThoiGianKhoiHanh: {
              [Op.gte]: departureTime
            },
            ThoiGianDuKienDen: {
              [Op.lte]: arrivalTime
            }
          }
        ]
      }
    });

    if (conflictingTrips.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Xe đã có lịch trình trong khoảng thời gian này'
      });
    }

    // ============================================
    // TẠO CHUYẾN XE
    // ============================================

    const trip = await Trip.create({
      MaTuyen,
      BienSoXe,
      ThoiGianKhoiHanh,
      ThoiGianDuKienDen,
      MaTaiXe: MaTaiXe || null,
      MaLoXe: MaLoXe || null
    });

    const tripWithDetails = await Trip.findByPk(trip.MaChuyen, {
      include: [
        {
          model: Route,
          as: 'route',
          include: [
            { model: Location, as: 'diemDi' },
            { model: Location, as: 'diemDen' }
          ]
        },
        { model: Bus, as: 'bus' },
        { 
          model: Employee, 
          as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['HoTen'] }]
        },
        { 
          model: Employee, 
          as: 'assistant',
          include: [{ model: User, as: 'user', attributes: ['HoTen'] }]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo chuyến xe thành công',
      data: tripWithDetails
    });
      
  } catch (error) {
    next(error);
  }
};
// @desc    Cập nhật chuyến xe
// @route   PUT /api/trips/:id
// @access  Private/Admin
// @desc    Cập nhật chuyến xe
// @route   PUT /api/trips/:id
// @access  Private/Admin
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    const { ThoiGianKhoiHanh, ThoiGianDuKienDen, MaTaiXe, MaLoXe } = req.body;

    // ============================================
    // ✅ VALIDATION khi cập nhật
    // ============================================

    const departureTime = ThoiGianKhoiHanh ? new Date(ThoiGianKhoiHanh) : trip.ThoiGianKhoiHanh;
    const arrivalTime = ThoiGianDuKienDen ? new Date(ThoiGianDuKienDen) : trip.ThoiGianDuKienDen;
    const now = new Date();

    // 1. Không cho sửa chuyến đã khởi hành
    if (trip.ThoiGianKhoiHanh < now) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa chuyến xe đã khởi hành'
      });
    }

    // 2. Thời gian khởi hành mới không được quá khứ
    if (ThoiGianKhoiHanh && departureTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian khởi hành không được ở quá khứ'
      });
    }

    // 3. Thời gian đến phải sau thời gian khởi hành
    if (arrivalTime <= departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian dự kiến đến phải sau thời gian khởi hành'
      });
    }

    await trip.update({
      ThoiGianKhoiHanh: ThoiGianKhoiHanh || trip.ThoiGianKhoiHanh,
      ThoiGianDuKienDen: ThoiGianDuKienDen || trip.ThoiGianDuKienDen,
      MaTaiXe: MaTaiXe !== undefined ? MaTaiXe : trip.MaTaiXe,
      MaLoXe: MaLoXe !== undefined ? MaLoXe : trip.MaLoXe
    });

    const updatedTrip = await Trip.findByPk(trip.MaChuyen, {
      include: [
        {
          model: Route,
          as: 'route',
          include: [
            { model: Location, as: 'diemDi' },
            { model: Location, as: 'diemDen' }
          ]
        },
        { model: Bus, as: 'bus' },
        { 
          model: Employee, 
          as: 'driver',
          include: [{ model: User, as: 'user', attributes: ['HoTen'] }]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật chuyến xe thành công',
      data: updatedTrip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa chuyến xe
// @route   DELETE /api/trips/:id
// @access  Private/Admin
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    await trip.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa chuyến xe thành công'
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Lấy danh sách hành khách của chuyến
// @route   GET /api/trips/:id/passengers
// @access  Private/Employee/Admin
const getTripPassengers = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    
    console.log('👥 Fetching passengers for trip:', tripId);

    const trip = await Trip.findByPk(tripId, {
      include: [
        {
          model: Route,
          as: 'route',
          include: [
            { model: Location, as: 'diemDi' },
            { model: Location, as: 'diemDen' }
          ]
        },
        {
          model: Bus,
          as: 'bus'
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe'
      });
    }

    // Lấy danh sách vé đã thanh toán
    const tickets = await Ticket.findAll({
      where: {
        MaChuyen: tripId,
        TrangThaiVe: [0, 1] // Chưa sử dụng hoặc đã thanh toán
      },
      include: [
        {
          model: Booking,
          as: 'booking',
          where: {
            TrangThaiTT: [1, 2] // Đã thanh toán hoặc chờ duyệt
          },
          required: true
        }
      ],
      order: [['MaGhe', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        trip,
        tickets
      }
    });

  } catch (error) {
    console.error('❌ Error fetching passengers:', error);
    next(error);
  }
};
module.exports = {
  searchTrips,
  getAllTrips,
  getTripById,
  getTripSeats,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripPassengers
};