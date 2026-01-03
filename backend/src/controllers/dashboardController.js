const { Booking, Ticket, Trip, Route, Location, PaymentMethod, User } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @desc    Lấy thống kê tổng quan
// @route   GET /api/dashboard/overview
// @access  Private/Admin
const getOverview = async (req, res, next) => {
  try {
    console.log('📊 Getting dashboard overview...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // 1. Tổng doanh thu
    const [revenueToday] = await sequelize.query(`
      SELECT COALESCE(SUM(TongTien), 0) as total
      FROM DonDatVe
      WHERE TrangThaiTT = 1 AND DATE(NgayThanhToan) = CURDATE()
    `);

    const [revenueWeek] = await sequelize.query(`
      SELECT COALESCE(SUM(TongTien), 0) as total
      FROM DonDatVe
      WHERE TrangThaiTT = 1 AND YEARWEEK(NgayThanhToan, 1) = YEARWEEK(CURDATE(), 1)
    `);

    const [revenueMonth] = await sequelize.query(`
      SELECT COALESCE(SUM(TongTien), 0) as total
      FROM DonDatVe
      WHERE TrangThaiTT = 1 AND YEAR(NgayThanhToan) = YEAR(CURDATE()) AND MONTH(NgayThanhToan) = MONTH(CURDATE())
    `);

    const [revenueYear] = await sequelize.query(`
      SELECT COALESCE(SUM(TongTien), 0) as total
      FROM DonDatVe
      WHERE TrangThaiTT = 1 AND YEAR(NgayThanhToan) = YEAR(CURDATE())
    `);

    // 2. Số vé đã bán
    const [ticketsToday] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM Ve v
      INNER JOIN DonDatVe d ON v.MaDon = d.MaDon
      WHERE d.TrangThaiTT = 1 AND DATE(d.NgayThanhToan) = CURDATE()
    `);

    const [ticketsMonth] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM Ve v
      INNER JOIN DonDatVe d ON v.MaDon = d.MaDon
      WHERE d.TrangThaiTT = 1 AND YEAR(d.NgayThanhToan) = YEAR(CURDATE()) AND MONTH(d.NgayThanhToan) = MONTH(CURDATE())
    `);

    // 3. Số chuyến xe
    const totalTrips = await Trip.count();
    const todayTrips = await Trip.count({
      where: {
        ThoiGianKhoiHanh: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // 4. Số người dùng
    const totalUsers = await User.count({
      where: { TrangThai: 1 }
    });

    res.json({
      success: true,
      data: {
        revenue: {
          today: parseFloat(revenueToday[0]?.total || 0),
          week: parseFloat(revenueWeek[0]?.total || 0),
          month: parseFloat(revenueMonth[0]?.total || 0),
          year: parseFloat(revenueYear[0]?.total || 0)
        },
        tickets: {
          today: parseInt(ticketsToday[0]?.count || 0),
          month: parseInt(ticketsMonth[0]?.count || 0)
        },
        trips: {
          total: totalTrips,
          today: todayTrips
        },
        users: {
          total: totalUsers
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting overview:', error);
    next(error);
  }
};

// @desc    Lấy biểu đồ doanh thu theo ngày (30 ngày gần nhất)
// @route   GET /api/dashboard/revenue-chart
// @access  Private/Admin
const getRevenueChart = async (req, res, next) => {
  try {
    console.log('📈 Getting revenue chart...');

    const [results] = await sequelize.query(`
      SELECT 
        DATE(NgayThanhToan) as date,
        COALESCE(SUM(TongTien), 0) as revenue,
        COUNT(DISTINCT MaDon) as orders
      FROM DonDatVe
      WHERE TrangThaiTT = 1
        AND NgayThanhToan >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(NgayThanhToan)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Error getting revenue chart:', error);
    next(error);
  }
};

// @desc    Top tuyến đường có doanh thu cao
// @route   GET /api/dashboard/top-routes
// @access  Private/Admin
const getTopRoutes = async (req, res, next) => {
  try {
    console.log('🏆 Getting top routes...');

    const [results] = await sequelize.query(`
      SELECT 
        r.MaTuyen,
        diemdi.TenDiaDiem as DiemDi,
        diemden.TenDiaDiem as DiemDen,
        COALESCE(SUM(d.TongTien), 0) as DoanhThu,
        COUNT(DISTINCT d.MaDon) as SoDon,
        COUNT(v.MaVe) as SoVe
      FROM TuyenDuong r
      LEFT JOIN ChuyenXe cx ON r.MaTuyen = cx.MaTuyen
      LEFT JOIN Ve v ON cx.MaChuyen = v.MaChuyen
      LEFT JOIN DonDatVe d ON v.MaDon = d.MaDon AND d.TrangThaiTT = 1
      LEFT JOIN DiaDiem diemdi ON r.DiemDi_ID = diemdi.MaDiaDiem
      LEFT JOIN DiaDiem diemden ON r.DiemDen_ID = diemden.MaDiaDiem
      GROUP BY r.MaTuyen, diemdi.TenDiaDiem, diemden.TenDiaDiem
      HAVING DoanhThu > 0
      ORDER BY DoanhThu DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Error getting top routes:', error);
    next(error);
  }
};

// @desc    Thống kê theo phương thức thanh toán
// @route   GET /api/dashboard/payment-methods
// @access  Private/Admin
const getPaymentMethodStats = async (req, res, next) => {
  try {
    console.log('💳 Getting payment method stats...');

    const [results] = await sequelize.query(`
      SELECT 
        pm.TenPTTT as name,
        COUNT(d.MaDon) as count,
        COALESCE(SUM(d.TongTien), 0) as total
      FROM PhuongThucThanhToan pm
      LEFT JOIN DonDatVe d ON pm.MaPTTT = d.MaPTTT AND d.TrangThaiTT = 1
      GROUP BY pm.MaPTTT, pm.TenPTTT
      HAVING count > 0
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Error getting payment stats:', error);
    next(error);
  }
};

module.exports = {
  getOverview,
  getRevenueChart,
  getTopRoutes,
  getPaymentMethodStats
};