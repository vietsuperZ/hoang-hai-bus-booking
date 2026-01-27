const SeatReservationService = require('../services/seatReservationService');
const { Ticket } = require('../models');
const { Op } = require('sequelize');

// @desc    Giữ chỗ ghế
// @route   POST /api/seats/reserve
// @access  Private
const reserveSeats = async (req, res, next) => {
  try {
    const { MaChuyen, seats } = req.body;
    const userId = req.user.MaNguoiDung;

    if (!MaChuyen || !seats || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ghế'
      });
    }

    // 1. Kiểm tra ghế đã đặt trong DB
    const bookedSeats = await Ticket.findAll({
      where: {
        MaChuyen,
        MaGhe: { [Op.in]: seats },
        TrangThaiVe: { [Op.in]: [0, 1] }
      }
    });

    if (bookedSeats.length > 0) {
      const bookedList = bookedSeats.map(s => s.MaGhe);
      return res.status(400).json({
        success: false,
        message: 'Một số ghế đã được đặt',
        bookedSeats: bookedList
      });
    }

    // 2. Giữ chỗ trong cache
    const result = SeatReservationService.reserveSeats(MaChuyen, seats, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Đã giữ chỗ thành công',
      data: {
        seats,
        expireAt: result.expireAt,
        remainingTime: result.remainingTime
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Lấy ghế đã giữ/đặt
// @route   GET /api/seats/reserved/:tripId
// @access  Public
const getReservedSeats = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // 1. Ghế đã đặt trong DB
    const bookedTickets = await Ticket.findAll({
      where: {
        MaChuyen: tripId,
        TrangThaiVe: { [Op.in]: [0, 1] }
      },
      attributes: ['MaGhe', 'TrangThaiVe']
    });

    // 2. Ghế đang giữ trong cache
    const reservedSeats = SeatReservationService.getReservedSeats(tripId);

    const result = {
      booked: bookedTickets.map(t => ({
        seatCode: t.MaGhe,
        status: t.TrangThaiVe === 1 ? 'booked' : 'reserved'
      })),
      holding: Object.keys(reservedSeats).map(seat => ({
        seatCode: seat,
        status: 'holding',
        expireAt: reservedSeats[seat].expireAt
      }))
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Hủy giữ chỗ
// @route   POST /api/seats/release
// @access  Private
const releaseSeats = async (req, res, next) => {
  try {
    const { MaChuyen, seats } = req.body;
    const userId = req.user.MaNguoiDung;

    SeatReservationService.releaseSeats(MaChuyen, seats, userId);

    res.json({
      success: true,
      message: 'Đã hủy giữ chỗ'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Kiểm tra thời gian còn lại
// @route   GET /api/seats/time-remaining/:tripId
// @access  Private
const getTimeRemaining = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.MaNguoiDung;

    const result = SeatReservationService.getTimeRemaining(tripId, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  reserveSeats,
  getReservedSeats,
  releaseSeats,
  getTimeRemaining
};