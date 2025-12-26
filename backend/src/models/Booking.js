const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  MaDon: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NguoiDung',
      key: 'MaNguoiDung'
    }
  },
  NgayDat: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  TongTien: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  GhiChuKhachHang: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  MaPTTT: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PhuongThucThanhToan',
      key: 'MaPTTT'
    }
  },
  NgayThanhToan: {
  type: DataTypes.DATE,
  allowNull: true,
  comment: 'Thời gian thanh toán thực tế'
},
  TrangThaiTT: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '0: Chưa thanh toán, 1: Đã thanh toán'
  },
  MaBooking: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Mã đặt chỗ duy nhất (VD: HH123456)'
  }
}, {
  tableName: 'DonDatVe',
  timestamps: true,
  createdAt: 'NgayDat',
  updatedAt: false
});

module.exports = Booking;