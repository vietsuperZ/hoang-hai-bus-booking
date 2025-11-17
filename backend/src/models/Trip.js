const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trip = sequelize.define('Trip', {
  MaChuyen: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  MaTuyen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'TuyenDuong',
      key: 'MaTuyen'
    }
  },
  BienSoXe: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'Xe',
      key: 'BienSoXe'
    }
  },
  ThoiGianKhoiHanh: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ThoiGianDuKienDen: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterDeparture(value) {
        if (value <= this.ThoiGianKhoiHanh) {
          throw new Error('Thời gian đến phải sau thời gian khởi hành');
        }
      }
    }
  },
  MaTaiXe: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NhanVien',
      key: 'MaNhanVien'
    }
  },
  MaLoXe: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NhanVien',
      key: 'MaNhanVien'
    }
  }
}, {
  tableName: 'ChuyenXe',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['MaTuyen', 'ThoiGianKhoiHanh']
    }
  ]
});

module.exports = Trip;