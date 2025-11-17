const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentMethod = sequelize.define('PaymentMethod', {
  MaPTTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  TenPTTT: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ tín dụng']]
    }
  },
  TrangThai: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1: Hoạt động, 0: Ngưng hoạt động'
  }
}, {
  tableName: 'PhuongThucThanhToan',
  timestamps: false
});

module.exports = PaymentMethod;