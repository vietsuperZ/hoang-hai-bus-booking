const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Position = require('./Position');
const Location = require('./Location');
const Bus = require('./Bus');
const Route = require('./Route');
const Employee = require('./Employee');
const Trip = require('./Trip');
const PaymentMethod = require('./PaymentMethod');
const Booking = require('./Booking');
const Ticket = require('./Ticket');


// ==================== RELATIONSHIPS ====================

// User - Role (Many-to-Many qua UserRole)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'MaNguoiDung',
  otherKey: 'MaVaiTro',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'MaVaiTro',
  otherKey: 'MaNguoiDung',
  as: 'users'
});

// Employee - User (One-to-One)
Employee.belongsTo(User, {
  foreignKey: 'MaNguoiDung',
  as: 'user'
});

User.hasOne(Employee, {
  foreignKey: 'MaNguoiDung',
  as: 'employee'
});

// Employee - Position (Many-to-One)
Employee.belongsTo(Position, {
  foreignKey: 'MaChucVu',
  as: 'position'
});

Position.hasMany(Employee, {
  foreignKey: 'MaChucVu',
  as: 'employees'
});

// Route - Location (Many-to-One for DiemDi)
Route.belongsTo(Location, {
  foreignKey: 'DiemDi_ID',
  as: 'diemDi'
});

// Route - Location (Many-to-One for DiemDen)
Route.belongsTo(Location, {
  foreignKey: 'DiemDen_ID',
  as: 'diemDen'
});

Location.hasMany(Route, {
  foreignKey: 'DiemDi_ID',
  as: 'routesFrom'
});

Location.hasMany(Route, {
  foreignKey: 'DiemDen_ID',
  as: 'routesTo'
});

// Trip - Route (Many-to-One)
Trip.belongsTo(Route, {
  foreignKey: 'MaTuyen',
  as: 'route'
});

Route.hasMany(Trip, {
  foreignKey: 'MaTuyen',
  as: 'trips'
});

// Trip - Bus (Many-to-One)
Trip.belongsTo(Bus, {
  foreignKey: 'BienSoXe',
  as: 'bus'
});

Bus.hasMany(Trip, {
  foreignKey: 'BienSoXe',
  as: 'trips'
});

// Trip - Employee (Tài xế)
Trip.belongsTo(Employee, {
  foreignKey: 'MaTaiXe',
  as: 'driver'
});

// Trip - Employee (Phụ xe)
Trip.belongsTo(Employee, {
  foreignKey: 'MaLoXe',
  as: 'assistant'
});

Employee.hasMany(Trip, {
  foreignKey: 'MaTaiXe',
  as: 'tripsAsDriver'
});

Employee.hasMany(Trip, {
  foreignKey: 'MaLoXe',
  as: 'tripsAsAssistant'
});

// Booking - User (Many-to-One)
Booking.belongsTo(User, {
  foreignKey: 'MaNguoiDung',
  as: 'user'
});

User.hasMany(Booking, {
  foreignKey: 'MaNguoiDung',
  as: 'bookings'
});

// Booking - PaymentMethod (Many-to-One)
Booking.belongsTo(PaymentMethod, {
  foreignKey: 'MaPTTT',
  as: 'paymentMethod'
});

PaymentMethod.hasMany(Booking, {
  foreignKey: 'MaPTTT',
  as: 'bookings'
});

// Ticket - Booking (Many-to-One)
Ticket.belongsTo(Booking, {
  foreignKey: 'MaDon',
  as: 'booking'
});

Booking.hasMany(Ticket, {
  foreignKey: 'MaDon',
  as: 'tickets'
});

// Ticket - Trip (Many-to-One)
Ticket.belongsTo(Trip, {
  foreignKey: 'MaChuyen',
  as: 'trip'
});

Trip.hasMany(Ticket, {
  foreignKey: 'MaChuyen',
  as: 'tickets'
});

// ==================== SYNC DATABASE ====================

const syncDatabase = async () => {
  try {
    // Sync theo thứ tự (tránh lỗi foreign key)
    await Role.sync({ alter: false });
    await User.sync({ alter: false });
    await UserRole.sync({ alter: false });
    await Position.sync({ alter: false });
    await Employee.sync({ alter: false });
    await Location.sync({ alter: false });
    await Bus.sync({ alter: false });
    await Route.sync({ alter: false });
    await Trip.sync({ alter: false });
    await PaymentMethod.sync({ alter: false });
    await Booking.sync({ alter: false });
    await Ticket.sync({ alter: false });
    
    console.log('✅ All models synced successfully!');
  } catch (error) {
    console.error('❌ Error syncing models:', error.message);
  }
};

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Position,
  Location,
  Bus,
  Route,
  Employee,
  Trip,
  PaymentMethod,
  Booking,
  Ticket,
  syncDatabase
};