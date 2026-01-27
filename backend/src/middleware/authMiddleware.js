const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ===== DÙNG RAW QUERY THAY VÌ User.findByPk =====
    const [user] = await sequelize.query(
      `SELECT 
        u.MaNguoiDung, 
        u.HoTen, 
        u.Email, 
        u.SDT, 
        u.TrangThai,
        u.createdAt,
        u.updatedAt
      FROM NguoiDung u
      WHERE u.MaNguoiDung = ?`,
      {
        replacements: [decoded.MaNguoiDung],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Lấy roles riêng
    const roles = await sequelize.query(
      `SELECT vt.MaVaiTro, vt.TenVaiTro
       FROM NguoiDung_VaiTro nvt
       JOIN VaiTro vt ON nvt.MaVaiTro = vt.MaVaiTro
       WHERE nvt.MaNguoiDung = ?`,
      {
        replacements: [decoded.MaNguoiDung],
        type: sequelize.QueryTypes.SELECT
      }
    );

    user.roles = roles;
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

// ===== THÊM FUNCTION AUTHORIZE =====
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Kiểm tra user đã authenticate chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    // Lấy danh sách roles của user
    const userRoles = req.user.roles?.map(r => r.TenVaiTro) || [];
    
    // Kiểm tra user có role được phép không
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    next();
  };
};

module.exports = { 
  authenticate,
  authorize  // ← THÊM EXPORT
};