
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/database');
const { syncDatabase } = require('./models');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeBookingRoutes = require('./routes/employeeBookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Khởi tạo Express app
const app = express();

// ==================== MIDDLEWARE ====================

// CORS - PHẢI ĐẶT TRƯỚC TIÊN!
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================

app.use('/api/employees', employeeRoutes);
app.use('/api/employee', employeeBookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api', routes);
app.use('/api/dashboard', dashboardRoutes);


// ==================== ERROR HANDLING ====================

app.use(notFound);
app.use(errorHandler);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Kết nối database
    await connectDB();
    
    // Sync models
    await syncDatabase();
    
    // Seed dữ liệu ban đầu (roles)
    await seedInitialData();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const refundRoutes = require('./routes/refund.routes');

app.use('/api/employee/refunds', refundRoutes);

// Seed dữ liệu ban đầu
const seedInitialData = async () => {
  try {
    const { Role, Position, Location, PaymentMethod } = require('./models');
    
    // Seed Roles
    const roles = ['Admin', 'Nhân viên', 'Khách hàng'];
    for (const roleName of roles) {
      await Role.findOrCreate({
        where: { TenVaiTro: roleName },
        defaults: { TenVaiTro: roleName }
      });
    }


    // Seed Positions
    const positions = ['Nhân viên Thu ngân', 'Tài xế', 'Phụ xe'];
    for (const posName of positions) {
      await Position.findOrCreate({
        where: { TenChucVu: posName },
        defaults: { TenChucVu: posName }
      });
    }
    
    // Seed Locations
    const locations = [
      { TenDiaDiem: 'Bến xe Đà Nẵng', TenTinh: 'Đà Nẵng' },
      { TenDiaDiem: 'Bến xe Huế', TenTinh: 'Thừa Thiên Huế' },
      { TenDiaDiem: 'Bến xe Hội An', TenTinh: 'Quảng Nam' },
      { TenDiaDiem: 'Bến xe Quảng Ngãi', TenTinh: 'Quảng Ngãi' },
      { TenDiaDiem: 'Bến xe Quy Nhơn', TenTinh: 'Bình Định' }
    ];
    
    for (const loc of locations) {
      await Location.findOrCreate({
        where: { TenDiaDiem: loc.TenDiaDiem },
        defaults: loc
      });
    }
    
    // Seed Payment Methods
    const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ tín dụng'];
    for (const method of paymentMethods) {
      await PaymentMethod.findOrCreate({
        where: { TenPTTT: method },
        defaults: { TenPTTT: method, TrangThai: 1 }
      });
    }
    
    console.log('✅ Initial data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
};

startServer();

module.exports = app;