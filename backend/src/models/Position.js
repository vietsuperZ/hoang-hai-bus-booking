const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Position = sequelize.define('Position', {
  MaChucVu: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  TenChucVu: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isIn: [['Nhân viên Thu ngân', 'Tài xế', 'Phụ xe']]
    }
  }
}, {
  tableName: 'ChucVu',
  timestamps: false
});

module.exports = Position;