import api from './api';

const bookingService = {
  // Tạo đơn đặt vé
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response;
  },

  // Lấy lịch sử đặt vé
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response;
  },

  // Lấy chi tiết đơn
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  // Hủy đơn
  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response;
  }
};

export default bookingService;