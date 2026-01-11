const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { HoTen, SDT, Email } = req.body; // ← CHỈ LẤY 3 TRƯỜNG
    const userId = req.user.MaNguoiDung;

    console.log('✏️ Updating profile:', userId);

    // Validate
    if (!HoTen || !SDT || !Email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(SDT)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (10-11 chữ số)'
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra email trùng
    const [existingUser] = await sequelize.query(
      'SELECT MaNguoiDung FROM NguoiDung WHERE LOWER(Email) = LOWER(?) AND MaNguoiDung != ?',
      {
        replacements: [Email.trim(), userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng bởi tài khoản khác'
      });
    }

    // ===== CẬP NHẬT CHỈ 3 CỘT CÓ SẴN =====
    await sequelize.query(
      'UPDATE NguoiDung SET HoTen = ?, SDT = ?, Email = ? WHERE MaNguoiDung = ?',
      {
        replacements: [
          HoTen.trim(), 
          SDT.trim(), 
          Email.toLowerCase().trim(), 
          userId
        ],
        type: sequelize.QueryTypes.UPDATE
      }
    );

    // Lấy user sau update
    const [updatedUser] = await sequelize.query(
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
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Lấy roles
    const roles = await sequelize.query(
      `SELECT vt.MaVaiTro, vt.TenVaiTro
       FROM NguoiDung_VaiTro nvt
       JOIN VaiTro vt ON nvt.MaVaiTro = vt.MaVaiTro
       WHERE nvt.MaNguoiDung = ?`,
      {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    updatedUser.roles = roles;

    console.log('✅ Profile updated successfully');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    next(error);
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { MatKhauCu, MatKhauMoi } = req.body;
    const userId = req.user.MaNguoiDung;

    console.log('🔐 Changing password:', userId);

    if (!MatKhauCu || !MatKhauMoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (MatKhauMoi.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải từ 6 ký tự'
      });
    }

    const [user] = await sequelize.query(
      'SELECT * FROM NguoiDung WHERE MaNguoiDung = ?',
      {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const isMatch = await bcrypt.compare(MatKhauCu, user.MatKhau);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(MatKhauMoi, salt);

    await sequelize.query(
      'UPDATE NguoiDung SET MatKhau = ? WHERE MaNguoiDung = ?',
      {
        replacements: [hashedPassword, userId],
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('✅ Password changed successfully');

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);
    next(error);
  }
};

module.exports = {
  updateProfile,
  changePassword
};