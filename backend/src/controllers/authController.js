const { User, Role, UserRole } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { HoTen, Email, MatKhau, SDT } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ where: { Email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo user mới
    const user = await User.create({
      HoTen,
      Email,
      MatKhau,
      SDT,
      TrangThai: 1
    });

    // Tìm vai trò "Khách hàng"
    let customerRole = await Role.findOne({ where: { TenVaiTro: 'Khách hàng' } });
    
    // Nếu chưa có, tạo mới
    if (!customerRole) {
      customerRole = await Role.create({ TenVaiTro: 'Khách hàng' });
    }

    // Gán vai trò "Khách hàng" cho user
    await UserRole.create({
      MaNguoiDung: user.MaNguoiDung,
      MaVaiTro: customerRole.MaVaiTro
    });

    // Lấy user với roles
    const userWithRoles = await User.findByPk(user.MaNguoiDung, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['MatKhau'] }
    });

    // Tạo token
    const accessToken = generateAccessToken({
      MaNguoiDung: user.MaNguoiDung,
      Email: user.Email
    });

    const refreshToken = generateRefreshToken({
      MaNguoiDung: user.MaNguoiDung
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: userWithRoles,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { Email, MatKhau } = req.body;

    // Validate input
    if (!Email || !MatKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user theo email (include password để so sánh)
    const user = await User.findOne({ 
      where: { Email },
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.TrangThai === 0) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa'
      });
    }

    // So sánh mật khẩu
    const isPasswordValid = await user.comparePassword(MatKhau);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Tạo token
    const accessToken = generateAccessToken({
      MaNguoiDung: user.MaNguoiDung,
      Email: user.Email
    });

    const refreshToken = generateRefreshToken({
      MaNguoiDung: user.MaNguoiDung
    });

    // Loại bỏ password khỏi response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    // Trong thực tế, bạn có thể lưu refresh token vào database
    // và xóa nó khi logout, hoặc dùng Redis để blacklist token
    
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};