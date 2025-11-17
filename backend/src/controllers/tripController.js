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
const createTrip = async (req, res, next) => {
  try {
    const { MaTuyen, BienSoXe, ThoiGianKhoiHanh, ThoiGianDuKienDen, MaTaiXe, MaLoXe } = req.body;

    const trip = await Trip.create({
      MaTuyen,
      BienSoXe,
      ThoiGianKhoiHanh,
      ThoiGianDuKienDen,
      MaTaiXe,
      MaLoXe
    });

    const tripWithDetails = await Trip.findByPk(trip.MaChuyen, {
      include: [
        { model: Route, as: 'route' },
        { model: Bus, as: 'bus' }
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

    await trip.update({
      ThoiGianKhoiHanh: ThoiGianKhoiHanh || trip.ThoiGianKhoiHanh,
      ThoiGianDuKienDen: ThoiGianDuKienDen || trip.ThoiGianDuKienDen,
      MaTaiXe: MaTaiXe !== undefined ? MaTaiXe : trip.MaTaiXe,
      MaLoXe: MaLoXe !== undefined ? MaLoXe : trip.MaLoXe
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật chuyến xe thành công',
      data: trip
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

module.exports = {
  searchTrips,
  getAllTrips,
  getTripById,
  getTripSeats,
  createTrip,
  updateTrip,
  deleteTrip
};