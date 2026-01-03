const { Employee, User, Position } = require('../models');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

// @desc    Lấy tất cả nhân viên
// @route   GET /api/employees
// @access  Private/Admin
const getAllEmployees = async (req, res, next) => {
  try {
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
    next(error);
  }
};

// @desc    Tạo nhân viên mới
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { HoTen, Email, SDT, MatKhau, MaChucVu } = req.body;

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

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // Tạo User
    const user = await User.create({
      HoTen,
      Email: Email.toLowerCase(),
      SDT,
      MatKhau: hashedPassword,
      TrangThai: 1
    }, { transaction });

    // Gán role Nhân viên (MaVaiTro = 2)
    await user.addRole(2, { transaction });

    // Tạo Employee
    const employee = await Employee.create({
      MaNguoiDung: user.MaNguoiDung,
      MaChucVu,
      TrangThai: 1
    }, { transaction });

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
    next(error);
  }
};

// @desc    Cập nhật nhân viên
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { HoTen, SDT, MaChucVu } = req.body;
    const employeeId = req.params.id;

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
    next(error);
  }
};

// @desc    Xóa nhân viên (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const employeeId = req.params.id;

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
    const { Trip } = require('../models');
    const assignedTrips = await Trip.count({
      where: {
        [sequelize.Op.or]: [
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

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error deleting employee:', error);
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};