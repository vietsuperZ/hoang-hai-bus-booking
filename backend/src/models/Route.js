const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Route = sequelize.define('Route', {
  MaTuyen: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  DiemDi_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DiaDiem',
      key: 'MaDiaDiem'
    }
  },
  DiemDen_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DiaDiem',
      key: 'MaDiaDiem'
    }
  },
  KhoangCach: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 2000 // km
    }
  },
  ThoiGianDuKien: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Thời gian dự kiến di chuyển'
  },
  GiaCoBan: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 50000,
      max: 5000000
    }
  }
}, {
  tableName: 'TuyenDuong',
  timestamps: false,
  validate: {
    diemDiKhacDiemDen() {
      if (this.DiemDi_ID === this.DiemDen_ID) {
        throw new Error('Điểm đi và điểm đến phải khác nhau');
      }
    }
  }
});

module.exports = Route;