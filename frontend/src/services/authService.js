import api from './api';

const authService = {
  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  // Lấy thông tin user hiện tại
  getMe: async () => {
    const response = await api.get('/auth/me');
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response;
  },

  // Lấy user từ localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // Kiểm tra role
  hasRole: (roleName) => {
    const user = authService.getCurrentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.TenVaiTro === roleName);
  }
};

export default authService;