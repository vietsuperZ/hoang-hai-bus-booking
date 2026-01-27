const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DanhGia = sequelize.define('DanhGia', {
  MaDanhGia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  MaVe: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ChiTietVe',
      key: 'MaVe'
    }
  },
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'MaNguoiDung'
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
  SoSao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  NoiDung: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  NgayDanhGia: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'DanhGia',
  timestamps: false
});

module.exports = DanhGia;