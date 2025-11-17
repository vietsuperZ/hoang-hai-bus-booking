const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  MaVaiTro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  TenVaiTro: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isIn: [['Admin', 'Nhân viên', 'Khách hàng']]
    }
  }
}, {
  tableName: 'VaiTro',
  timestamps: false
});

module.exports = Role;