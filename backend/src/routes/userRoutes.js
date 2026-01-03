const express = require('express');
const router = express.Router();
const { User, Role } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { sequelize } = require('../config/database');

// ==================== GET - Lấy danh sách users ====================
router.get('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    console.log('📋 Fetching users...');
    
    const users = await User.findAll({
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['MaVaiTro', 'TenVaiTro'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['MatKhau'] },
      order: [['MaNguoiDung', 'DESC']]
    });

    console.log(`✅ Found ${users.length} users`);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tài khoản',
      error: error.message
    });
  }
});

// ==================== PUT - Cập nhật trạng thái user (Khóa/Mở khóa) ====================
router.put('/:id/status', authenticate, authorize('Admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const { TrangThai } = req.body;

    console.log('🔒 Updating user status:', userId, 'to', TrangThai);

    // Validate
    if (TrangThai !== 0 && TrangThai !== 1) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (0 hoặc 1)'
      });
    }

    // Tìm user
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['TenVaiTro']
      }],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // KHÔNG cho phép khóa tài khoản Admin
    const isAdmin = user.roles?.some(r => r.TenVaiTro === 'Admin');
    if (isAdmin && TrangThai === 0) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản Admin!'
      });
    }

    // Cập nhật trạng thái
    await user.update({ TrangThai }, { transaction });

    await transaction.commit();

    console.log('✅ User status updated');

    res.json({
      success: true,
      message: TrangThai === 1 ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
      data: {
        MaNguoiDung: user.MaNguoiDung,
        TrangThai
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái tài khoản',
      error: error.message
    });
  }
});

// ==================== PUT - Cập nhật vai trò user ====================
router.put('/:id/role', authenticate, authorize('Admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const { MaVaiTro } = req.body;

    console.log('👤 Updating user role:', userId, 'to role', MaVaiTro);

    // Validate
    if (!MaVaiTro || ![1, 2, 3].includes(MaVaiTro)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ (1=Admin, 2=Nhân viên, 3=Khách hàng)'
      });
    }

    // Tìm user
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Xóa role cũ
    const { UserRole } = require('../models');
    await UserRole.destroy({
      where: { MaNguoiDung: userId },
      transaction
    });

    // Thêm role mới
    await UserRole.create({
      MaNguoiDung: userId,
      MaVaiTro
    }, { transaction });

    await transaction.commit();

    console.log('✅ User role updated');

    res.json({
      success: true,
      message: 'Cập nhật vai trò thành công',
      data: {
        MaNguoiDung: userId,
        MaVaiTro
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật vai trò',
      error: error.message
    });
  }
});

module.exports = router;