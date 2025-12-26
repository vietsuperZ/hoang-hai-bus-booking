import api from './api';

const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response;
  },

  // THÊM - Kiểm tra trạng thái thanh toán
  checkPaymentStatus: async (bookingCode) => {
    const response = await api.post('/bookings/check-payment', { bookingCode });
    return response;
  }
};

export default bookingService;