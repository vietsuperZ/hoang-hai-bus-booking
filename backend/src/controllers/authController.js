const { User, Role, UserRole } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { HoTen, Email, MatKhau, SDT } = req.body;

    const existingUser = await User.findOne({ where: { Email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    const user = await User.create({
      HoTen,
      Email,
      MatKhau,
      SDT,
      TrangThai: 1
    });

    let customerRole = await Role.findOne({ where: { TenVaiTro: 'Khách hàng' } });
    
    if (!customerRole) {
      customerRole = await Role.create({ TenVaiTro: 'Khách hàng' });
    }

    await UserRole.create({
      MaNguoiDung: user.MaNguoiDung,
      MaVaiTro: customerRole.MaVaiTro
    });

    const userWithRoles = await User.findByPk(user.MaNguoiDung, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['MatKhau'] }
    });

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

    console.log('🔐 Login attempt:', Email);

    if (!Email || !MatKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

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

    if (user.TrangThai === 0) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa'
      });
    }

    const isPasswordValid = await user.comparePassword(MatKhau);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    const accessToken = generateAccessToken({
      MaNguoiDung: user.MaNguoiDung,
      Email: user.Email
    });

    const refreshToken = generateRefreshToken({
      MaNguoiDung: user.MaNguoiDung
    });

    const userResponse = user.toJSON();

    console.log('✅ Login successful!');

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
    console.error('❌ Login error:', error);
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