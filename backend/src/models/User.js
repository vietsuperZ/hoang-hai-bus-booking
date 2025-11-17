const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  MaNguoiDung: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  HoTen: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  MatKhau: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  SDT: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[0-9]{10,11}$/i // Số điện thoại VN 10-11 số
    }
  },
  TrangThai: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1: Hoạt động, 0: Bị khóa'
  }
}, {
  tableName: 'NguoiDung',
  timestamps: true,
  hooks: {
    // Tự động hash password trước khi lưu
    beforeCreate: async (user) => {
      if (user.MatKhau) {
        const salt = await bcrypt.genSalt(10);
        user.MatKhau = await bcrypt.hash(user.MatKhau, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('MatKhau')) {
        const salt = await bcrypt.genSalt(10);
        user.MatKhau = await bcrypt.hash(user.MatKhau, salt);
      }
    }
  }
});

// Method để so sánh password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.MatKhau);
};

// Method để lấy user info (không bao gồm password)
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.MatKhau;
  return values;
};

module.exports = User;