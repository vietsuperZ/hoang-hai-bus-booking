const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  MaNhanVien: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'MaNguoiDung'
    }
  },
  MaChucVu: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ChucVu',
      key: 'MaChucVu'
    }
  },
  TrangThai: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1: Đang làm việc, 0: Nghỉ việc'
  },
  NgayTao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'NhanVien',
  timestamps: false
});

module.exports = Employee;