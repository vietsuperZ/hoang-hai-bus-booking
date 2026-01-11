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

  // ===== FIX: LẤY USER AN TOÀN =====
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      
      // Kiểm tra kỹ trước khi parse
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
      localStorage.removeItem('user'); // Xóa data lỗi
      return null;
    }
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    return !!token && token !== 'undefined' && token !== 'null';
  },

  // Kiểm tra role
  hasRole: (roleName) => {
    const user = authService.getCurrentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.TenVaiTro === roleName);
  }
};

export default authService;