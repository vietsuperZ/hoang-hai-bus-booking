import api from './api';

const tripService = {
  // Tìm kiếm chuyến xe
  searchTrips: async (params) => {
    const { diemDi, diemDen, ngayDi } = params;
    const response = await api.get('/trips/search', {
      params: { diemDi, diemDen, ngayDi }
    });
    return response;
  },

  // Lấy chi tiết chuyến
  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response;
  },

  // Lấy sơ đồ ghế
  getTripSeats: async (id) => {
    const response = await api.get(`/trips/${id}/seats`);
    return response;
  },

  // Lấy danh sách địa điểm
  getLocations: async () => {
    const response = await api.get('/locations');
    return response;
  }
};

export default tripService;