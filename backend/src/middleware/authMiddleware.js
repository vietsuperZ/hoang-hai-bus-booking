const { verifyAccessToken } = require('../config/jwt');
const { User, Role } = require('../models');

// Middleware xác thực JWT
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Lấy thông tin user từ database
    const user = await User.findByPk(decoded.MaNguoiDung, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['MatKhau'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    if (user.TrangThai === 0) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa'
      });
    }

    // Gán user vào request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
      error: error.message
    });
  }
};

module.exports = { authenticate };