const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+07:00', // Múi giờ Việt Nam
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true, // Tự động thêm createdAt, updatedAt
      underscored: false // Dùng camelCase thay vì snake_case
    }
  }
);

// Test kết nối
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    
    // Sync models (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // alter: true để tự động update schema
      console.log('✅ Database synced!');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };