const express = require('express');
const router = express.Router();
const { Employee, User, Position, Trip, UserRole } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// ==================== GET - Lấy danh sách nhân viên ====================
router.get('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    console.log('📋 Fetching employees...');
    
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
        },
        {
          model: Position,
          as: 'position',
          attributes: ['MaChucVu', 'TenChucVu']
        }
      ],
      where: {
        TrangThai: 1 // Chỉ lấy nhân viên đang làm việc
      },
      order: [['MaNhanVien', 'ASC']]
    });

    console.log(`✅ Found ${employees.length} employees`);

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhân viên',
      error: error.message
    });
  }
});

// ==================== POST - Tạo nhân viên mới ====================
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { HoTen, Email, SDT, MatKhau, MaChucVu } = req.body;

    console.log('📝 Creating employee:', { HoTen, Email, MaChucVu });

    // Validate
    if (!HoTen || !Email || !SDT || !MatKhau || !MaChucVu) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({
      where: { Email: Email.toLowerCase() }
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Tạo User (password sẽ tự động được hash bởi User model hook)
    const user = await User.create({
      HoTen,
      Email: Email.toLowerCase(),
      SDT,
      MatKhau, // KHÔNG hash ở đây, để User model tự hash
      TrangThai: 1
    }, { transaction });

    console.log('✅ User created:', user.MaNguoiDung);

    // Gán role Nhân viên (MaVaiTro = 2) - Insert vào bảng trung gian
    await UserRole.create({
      MaNguoiDung: user.MaNguoiDung,
      MaVaiTro: 2 // Nhân viên
    }, { transaction });

    console.log('✅ Role assigned');

    // Tạo Employee
    const employee = await Employee.create({
      MaNguoiDung: user.MaNguoiDung,
      MaChucVu,
      TrangThai: 1
    }, { transaction });

    console.log('✅ Employee created:', employee.MaNhanVien);

    await transaction.commit();

    // Lấy thông tin đầy đủ
    const employeeWithDetails = await Employee.findByPk(employee.MaNhanVien, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
        },
        {
          model: Position,
          as: 'position',
          attributes: ['MaChucVu', 'TenChucVu']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhân viên thành công',
      data: employeeWithDetails
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nhân viên',
      error: error.message
    });
  }
});

// ==================== PUT - Cập nhật nhân viên ====================
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { HoTen, SDT, MaChucVu } = req.body;
    const employeeId = req.params.id;

    console.log('✏️ Updating employee:', employeeId);

    // Tìm employee
    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Cập nhật User
    if (HoTen || SDT) {
      await employee.user.update({
        HoTen: HoTen || employee.user.HoTen,
        SDT: SDT || employee.user.SDT
      }, { transaction });
    }

    // Cập nhật Employee
    if (MaChucVu) {
      await employee.update({
        MaChucVu
      }, { transaction });
    }

    await transaction.commit();

    console.log('✅ Employee updated');

    // Lấy thông tin đầy đủ
    const employeeWithDetails = await Employee.findByPk(employeeId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['MaNguoiDung', 'HoTen', 'Email', 'SDT']
        },
        {
          model: Position,
          as: 'position',
          attributes: ['MaChucVu', 'TenChucVu']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cập nhật nhân viên thành công',
      data: employeeWithDetails
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật nhân viên',
      error: error.message
    });
  }
});

// ==================== DELETE - Xóa nhân viên (soft delete) ====================
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const employeeId = req.params.id;

    console.log('🗑️ Deleting employee:', employeeId);

    // Tìm employee
    const employee = await Employee.findByPk(employeeId, { transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Kiểm tra có đang phân công chuyến không
    const assignedTrips = await Trip.count({
      where: {
        [Op.or]: [
          { MaTaiXe: employeeId },
          { MaLoXe: employeeId }
        ]
      },
      transaction
    });

    if (assignedTrips > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không thể xóa! Nhân viên đang được phân công ${assignedTrips} chuyến xe.`
      });
    }

    // Soft delete - Đổi trạng thái thành 0
    await employee.update({ TrangThai: 0 }, { transaction });

    // Cập nhật User
    await User.update(
      { TrangThai: 0 },
      { where: { MaNguoiDung: employee.MaNguoiDung }, transaction }
    );

    await transaction.commit();

    console.log('✅ Employee deleted (soft)');

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa nhân viên',
      error: error.message
    });
  }
});

module.exports = router;