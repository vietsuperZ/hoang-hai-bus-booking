const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  MaVe: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  MaDon: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DonDatVe',
      key: 'MaDon'
    }
  },
  MaChuyen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ChuyenXe',
      key: 'MaChuyen'
    }
  },
  MaGhe: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Mã số ghế (A01, A02, B01...)'
  },
  GiaVe: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  DiemDonChiTiet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DiemTraChiTiet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  TenHanhKhach: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  SDT: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[0-9]{10,11}$/i
    }
  },
  TrangThaiVe: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Đang giữ chỗ, 1: Đã thanh toán, 2: Đã hủy'
  }
}, {
  tableName: 'ChiTietVe',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['MaChuyen', 'MaGhe']
    }
  ]
});

module.exports = Ticket;