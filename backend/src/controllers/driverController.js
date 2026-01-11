const { Trip, Route, Location, Bus, Ticket, Booking } = require('../models');
const { sequelize } = require('../config/database');

// @desc    Lấy danh sách chuyến của tài xế
// @route   GET /api/driver/my-trips
// @access  Private/Driver
const getMyTrips = async (req, res, next) => {
  try {
    const driverId = req.user.MaNhanVien; // Lấy từ token

    console.log('🚗 Fetching trips for driver:', driverId);

    const trips = await Trip.findAll({
      where: {
        MaTaiXe: driverId
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
        {
          model: Bus,
          as: 'bus'
        }
      ],
      order: [['ThoiGianKhoiHanh', 'DESC']]
    });

    // Đếm số hành khách cho mỗi chuyến
    const tripsWithPassengers = await Promise.all(
      trips.map(async (trip) => {
        const bookedSeats = await Ticket.count({
          where: {
            MaChuyen: trip.MaChuyen,
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
          ]
        });

        return {
          ...trip.toJSON(),
          bookedSeats
        };
      })
    );

    res.json({
      success: true,
      data: tripsWithPassengers
    });

  } catch (error) {
    console.error('❌ Error fetching driver trips:', error);
    next(error);
  }
};

module.exports = {
  getMyTrips
};