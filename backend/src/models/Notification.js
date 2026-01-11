const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  MaThongBao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  NoiDung: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  NgayThongBao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  TrangThaiDoc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  LoaiThongBao: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'ThongBaoNguoiDung',
  timestamps: false
});

module.exports = Notification;