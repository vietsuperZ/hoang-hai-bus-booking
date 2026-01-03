const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { HoTen, SDT, Email, GioiTinh, NgaySinh, Avatar } = req.body;
    const userId = req.user.MaNguoiDung;

    console.log('✏️ Updating profile:', userId);

    // Validate
    if (!HoTen || !SDT || !Email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Tìm user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra email mới có trùng với user khác không
    if (Email !== user.Email) {
      const existingUser = await User.findOne({
        where: {
          Email: Email.toLowerCase(),
          MaNguoiDung: { [require('sequelize').Op.ne]: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng bởi tài khoản khác'
        });
      }
    }

    // Cập nhật
    await user.update({
      HoTen: HoTen.trim(),
      SDT: SDT.trim(),
      Email: Email.toLowerCase().trim(),
      GioiTinh: GioiTinh || null,
      NgaySinh: NgaySinh || null,
      Avatar: Avatar || null
    });

    // Lấy user với roles
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['MatKhau'] }
    });

    console.log('✅ Profile updated');

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

    // Validate
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

    // Tìm user (include password)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await user.comparePassword(MatKhauCu);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới (sẽ tự động hash bởi hook beforeUpdate)
    await user.update({
      MatKhau: MatKhauMoi
    });

    console.log('✅ Password changed');

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