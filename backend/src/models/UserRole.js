const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'NguoiDung',
      key: 'MaNguoiDung'
    }
  },
  MaVaiTro: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'VaiTro',
      key: 'MaVaiTro'
    }
  }
}, {
  tableName: 'NguoiDung_VaiTro',
  timestamps: false
});

module.exports = UserRole;