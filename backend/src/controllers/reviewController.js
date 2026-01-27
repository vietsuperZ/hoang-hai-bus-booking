const { sequelize } = require('../config/database');

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { MaChuyen, DiemSo, NoiDung } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    console.log('📝 Creating review for trip:', MaChuyen);

    // Kiểm tra user đã đi chuyến này chưa (có vé đã hoàn thành)
    const [userTicket] = await sequelize.query(
      `SELECT cv.*, cx.ThoiGianKhoiHanh
       FROM ChiTietVe cv
       JOIN ChuyenXe cx ON cv.MaChuyen = cx.MaChuyen
       JOIN DonDatVe ddv ON cv.MaDon = ddv.MaDon
       WHERE cv.MaChuyen = ? 
         AND ddv.MaNguoiDung = ?
         AND cv.TrangThaiVe = 1
       LIMIT 1`,
      {
        replacements: [MaChuyen, MaNguoiDung],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!userTicket) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đi chuyến xe này hoặc vé chưa được duyệt'
      });
    }

    // Kiểm tra chuyến đã hoàn thành chưa
    const now = new Date();
    const departureTime = new Date(userTicket.ThoiGianKhoiHanh);
    
    if (departureTime > now) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh giá sau khi chuyến xe hoàn thành'
      });
    }

    // Kiểm tra đã đánh giá chưa
    const [existingReview] = await sequelize.query(
      'SELECT * FROM DanhGia WHERE MaChuyen = ? AND MaNguoiDung = ?',
      {
        replacements: [MaChuyen, MaNguoiDung],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá chuyến xe này rồi'
      });
    }

    // Validate DiemSo
    if (DiemSo < 1 || DiemSo > 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Điểm số phải từ 1 đến 5'
      });
    }

    // Tạo đánh giá
    await sequelize.query(
      `INSERT INTO DanhGia (MaNguoiDung, MaChuyen, DiemSo, NoiDung)
       VALUES (?, ?, ?, ?)`,
      {
        replacements: [MaNguoiDung, MaChuyen, DiemSo, NoiDung || null],
        type: sequelize.QueryTypes.INSERT,
        transaction
      }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công!'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error creating review:', error);
    next(error);
  }
};

// @desc    Lấy đánh giá của user cho 1 chuyến
// @route   GET /api/reviews/trip/:tripId/my-review
// @access  Private
const getMyReviewForTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung;

    const [review] = await sequelize.query(
      `SELECT dg.*, nd.HoTen
       FROM DanhGia dg
       JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
       WHERE dg.MaChuyen = ? AND dg.MaNguoiDung = ?`,
      {
        replacements: [tripId, MaNguoiDung],
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: review || null
    });

  } catch (error) {
    console.error('❌ Error getting review:', error);
    next(error);
  }
};


// @desc    Lấy đánh giá mới nhất (cho trang chủ)
// @route   GET /api/reviews/latest
// @access  Public
const getLatestReviews = async (req, res, next) => {
  try {
    console.log('🔍 Getting latest reviews...');
    const limit = req.query.limit || 6;

    const reviews = await sequelize.query(
      `SELECT 
        dg.*,
        nd.HoTen,
        cx.MaChuyen,
        CONCAT(dd1.TenDiaDiem, ' → ', dd2.TenDiaDiem) AS TenTuyen,
        cx.ThoiGianKhoiHanh
       FROM DanhGia dg
       JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
       JOIN ChuyenXe cx ON dg.MaChuyen = cx.MaChuyen
       JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
       JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
       JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
       ORDER BY dg.NgayDanhGia DESC
       LIMIT ?`,
      {
        replacements: [parseInt(limit)],
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('✅ Found reviews:', reviews.length);

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('❌ Error getting latest reviews:', error);
    next(error);
  }
};
// @desc    Lấy tất cả đánh giá của 1 chuyến xe
// @route   GET /api/reviews/trip/:tripId
// @access  Public
const getReviewsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const reviews = await sequelize.query(
      `SELECT dg.*, nd.HoTen
       FROM DanhGia dg
       JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
       WHERE dg.MaChuyen = ?
       ORDER BY dg.NgayDanhGia DESC`,
      {
        replacements: [tripId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Tính trung bình sao
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.DiemSo, 0) / totalReviews
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('❌ Error getting reviews:', error);
    next(error);
  }
};

// @desc    Cập nhật đánh giá
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { DiemSo, NoiDung } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    // Validate DiemSo
    if (DiemSo < 1 || DiemSo > 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Điểm số phải từ 1 đến 5'
      });
    }

    // Kiểm tra review có thuộc về user không
    const [review] = await sequelize.query(
      'SELECT * FROM DanhGia WHERE MaDanhGia = ? AND MaNguoiDung = ?',
      {
        replacements: [id, MaNguoiDung],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Cập nhật
    await sequelize.query(
      'UPDATE DanhGia SET DiemSo = ?, NoiDung = ? WHERE MaDanhGia = ?',
      {
        replacements: [DiemSo, NoiDung || null, id],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công!'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error updating review:', error);
    next(error);
  }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung;

    // Kiểm tra review có thuộc về user không
    const [review] = await sequelize.query(
      'SELECT * FROM DanhGia WHERE MaDanhGia = ? AND MaNguoiDung = ?',
      {
        replacements: [id, MaNguoiDung],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Xóa
    await sequelize.query(
      'DELETE FROM DanhGia WHERE MaDanhGia = ?',
      {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công!'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error deleting review:', error);
    next(error);
  }
};

// @desc    Admin - Lấy tất cả đánh giá với filter
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviewsForAdmin = async (req, res, next) => {
  try {
    const { rating, routeId, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let replacements = [];

    // Filter theo rating
    if (rating) {
      whereClause += ' AND dg.DiemSo = ?';
      replacements.push(parseInt(rating));
    }

    // Filter theo tuyến
    if (routeId) {
      whereClause += ' AND td.MaTuyen = ?';
      replacements.push(parseInt(routeId));
    }

    // Search theo tên khách hoặc nội dung
    if (search) {
      whereClause += ' AND (nd.HoTen LIKE ? OR dg.NoiDung LIKE ?)';
      replacements.push(`%${search}%`, `%${search}%`);
    }

    // Đếm tổng số
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM DanhGia dg
       JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
       JOIN ChuyenXe cx ON dg.MaChuyen = cx.MaChuyen
       JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
       WHERE 1=1 ${whereClause}`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Lấy danh sách đánh giá
    const reviews = await sequelize.query(
      `SELECT 
        dg.*,
        nd.HoTen AS KhachHang,
        nd.Email AS EmailKhach,
        nd.SDT AS SDTKhach,
        cx.MaChuyen,
        cx.ThoiGianKhoiHanh,
        CONCAT(dd1.TenDiaDiem, ' → ', dd2.TenDiaDiem) AS TenTuyen,
        td.MaTuyen,
        x.BienSoXe,
        x.LoaiXe,
        tx.HoTen AS TenTaiXe,
        tx.SDT AS SDTTaiXe
       FROM DanhGia dg
       JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
       JOIN ChuyenXe cx ON dg.MaChuyen = cx.MaChuyen
       JOIN TuyenDuong td ON cx.MaTuyen = td.MaTuyen
       JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
       JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
       JOIN Xe x ON cx.BienSoXe = x.BienSoXe
       LEFT JOIN NguoiDung tx ON cx.MaTaiXe = tx.MaNguoiDung
       WHERE 1=1 ${whereClause}
       ORDER BY dg.NgayDanhGia DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, parseInt(limit), offset],
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: {
        reviews,
        total: countResult.total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error getting admin reviews:', error);
    next(error);
  }
};

// @desc    Admin - Thống kê đánh giá
// @route   GET /api/reviews/admin/statistics
// @access  Private/Admin
const getReviewStatistics = async (req, res, next) => {
  try {
    // Tổng quan
    const [overview] = await sequelize.query(
      `SELECT 
        COUNT(*) as totalReviews,
        AVG(DiemSo) as averageRating,
        SUM(CASE WHEN DiemSo = 5 THEN 1 ELSE 0 END) as fiveStars,
        SUM(CASE WHEN DiemSo = 4 THEN 1 ELSE 0 END) as fourStars,
        SUM(CASE WHEN DiemSo = 3 THEN 1 ELSE 0 END) as threeStars,
        SUM(CASE WHEN DiemSo = 2 THEN 1 ELSE 0 END) as twoStars,
        SUM(CASE WHEN DiemSo = 1 THEN 1 ELSE 0 END) as oneStar
       FROM DanhGia`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Top tuyến đường có đánh giá cao nhất
    const topRoutes = await sequelize.query(
      `SELECT 
        td.MaTuyen,
        CONCAT(dd1.TenDiaDiem, ' → ', dd2.TenDiaDiem) AS TenTuyen,
        COUNT(dg.MaDanhGia) as totalReviews,
        AVG(dg.DiemSo) as averageRating
       FROM TuyenDuong td
       JOIN DiaDiem dd1 ON td.DiemDi_ID = dd1.MaDiaDiem
       JOIN DiaDiem dd2 ON td.DiemDen_ID = dd2.MaDiaDiem
       JOIN ChuyenXe cx ON td.MaTuyen = cx.MaTuyen
       JOIN DanhGia dg ON cx.MaChuyen = dg.MaChuyen
       GROUP BY td.MaTuyen
       HAVING totalReviews >= 3
       ORDER BY averageRating DESC, totalReviews DESC
       LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Top tài xế có đánh giá cao nhất
    const topDrivers = await sequelize.query(
      `SELECT 
        nd.MaNguoiDung,
        nd.HoTen,
        nd.SDT,
        COUNT(dg.MaDanhGia) as totalReviews,
        AVG(dg.DiemSo) as averageRating
       FROM NguoiDung nd
       JOIN ChuyenXe cx ON nd.MaNguoiDung = cx.MaTaiXe
       JOIN DanhGia dg ON cx.MaChuyen = dg.MaChuyen
       WHERE cx.MaTaiXe IS NOT NULL
       GROUP BY nd.MaNguoiDung
       HAVING totalReviews >= 3
       ORDER BY averageRating DESC, totalReviews DESC
       LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Đánh giá theo tháng (6 tháng gần nhất)
    const reviewsByMonth = await sequelize.query(
      `SELECT 
        DATE_FORMAT(NgayDanhGia, '%Y-%m') as month,
        COUNT(*) as count,
        AVG(DiemSo) as averageRating
       FROM DanhGia
       WHERE NgayDanhGia >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(NgayDanhGia, '%Y-%m')
       ORDER BY month DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        overview,
        topRoutes,
        topDrivers,
        reviewsByMonth
      }
    });

  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    next(error);
  }
};

// @desc    Admin - Xóa đánh giá
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
const deleteReviewByAdmin = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const [review] = await sequelize.query(
      'SELECT * FROM DanhGia WHERE MaDanhGia = ?',
      {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    await sequelize.query(
      'DELETE FROM DanhGia WHERE MaDanhGia = ?',
      {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công!'
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error deleting review:', error);
    next(error);
  }
};
module.exports = {
  createReview,
  getMyReviewForTrip,
  getReviewsByTrip,
  updateReview,
  deleteReview,
  getLatestReviews,
   getAllReviewsForAdmin,      // ← THÊM
  getReviewStatistics,         // ← THÊM
  deleteReviewByAdmin
};