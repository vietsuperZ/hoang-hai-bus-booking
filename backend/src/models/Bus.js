const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bus = sequelize.define('Bus', {
  BienSoXe: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      // Format: 29A-12345 hoặc 43B-123.45
      is: /^[0-9]{2}[A-Z]-[0-9]{3,5}(\.[0-9]{2})?$/i
    }
  },
  LoaiXe: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['Giường nằm', 'Ghế ngồi', 'Limousine']]
    }
  },
  SoLuongGhe: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 16,
      max: 45
    }
  },
  NamSanXuat: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2000,
      max: new Date().getFullYear()
    }
  }
}, {
  tableName: 'Xe',
  timestamps: false
});

module.exports = Bus;