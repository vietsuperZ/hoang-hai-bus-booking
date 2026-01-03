import api from './api';

const adminService = {
  // ==================== DASHBOARD ====================
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response;
  },

  // ==================== BOOKINGS ====================
  getAllBookings: async (params) => {
    const response = await api.get('/bookings', { params });
    return response;
  },

  approveBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/approve`);
    return response;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  // ==================== TRIPS ====================
  getAllTrips: async () => {
    const response = await api.get('/trips');
    return response;
  },

  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response;
  },

  updateTrip: async (id, tripData) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response;
  },

  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response;
  },

  // ==================== ROUTES ====================
  getAllRoutes: async () => {
    const response = await api.get('/routes');
    return response;
  },

  createRoute: async (routeData) => {
    const response = await api.post('/routes', routeData);
    return response;
  },

  updateRoute: async (id, routeData) => {
    const response = await api.put(`/routes/${id}`, routeData);
    return response;
  },

  deleteRoute: async (id) => {
    const response = await api.delete(`/routes/${id}`);
    return response;
  },

  // ==================== BUSES ====================
  getAllBuses: async () => {
    const response = await api.get('/buses');
    return response;
  },

  createBus: async (busData) => {
    const response = await api.post('/buses', busData);
    return response;
  },

  updateBus: async (bienSoXe, busData) => {
    const response = await api.put(`/buses/${bienSoXe}`, busData);
    return response;
  },

  deleteBus: async (bienSoXe) => {
    const response = await api.delete(`/buses/${bienSoXe}`);
    return response;
  },

  // ==================== LOCATIONS ====================
  getAllLocations: async () => {
    const response = await api.get('/locations');
    return response;
  },

  createLocation: async (locationData) => {
    const response = await api.post('/locations', locationData);
    return response;
  },

  updateLocation: async (id, locationData) => {
    const response = await api.put(`/locations/${id}`, locationData);
    return response;
  },

  deleteLocation: async (id) => {
    const response = await api.delete(`/locations/${id}`);
    return response;
  },

  // ==================== EMPLOYEES ====================
  getAllEmployees: async () => {
    const response = await api.get('/employees');
    return response;
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return response;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response;
  },

  // ==================== USERS ====================
  getAllUsers: async (filters) => {
    const response = await api.get('/users', { params: filters });
    return response;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.put(`/users/${id}/status`, { TrangThai: status });
    return response;
  },

  updateUserRole: async (id, roleId) => {
    const response = await api.put(`/users/${id}/role`, { MaVaiTro: roleId });
    return response;
  },

  // ==================== DASHBOARD ====================
  getDashboardOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response;
  },

  getRevenueChart: async () => {
    const response = await api.get('/dashboard/revenue-chart');
    return response;
  },

  getTopRoutes: async () => {
    const response = await api.get('/dashboard/top-routes');
    return response;
  },

  getPaymentMethodStats: async () => {
    const response = await api.get('/dashboard/payment-methods');
    return response;
  }
};

export default adminService;