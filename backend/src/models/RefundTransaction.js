// File: backend/src/models/RefundTransaction.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefundTransaction = sequelize.define('RefundTransaction', {
  MaHoanTien: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Mã giao dịch hoàn tiền'
  },
  MaVe: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'Mã vé đã bị hủy (mỗi vé chỉ hoàn tiền 1 lần)'
  },
  SoTienHoan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    },
    comment: 'Số tiền thực tế hoàn lại'
  },
  NgayHoanTien: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Ngày hoàn tiền'
  },
  NhanVienXuLy_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Nhân viên (Thu ngân) xử lý hoàn tiền'
  },
  TrangThai: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '0=Chờ xử lý, 1=Đã hoàn'
  },
  GhiChu: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú về giao dịch hoàn tiền'
  }
}, {
  tableName: 'GiaoDichHoanTien',
  timestamps: false
});

module.exports = RefundTransaction;