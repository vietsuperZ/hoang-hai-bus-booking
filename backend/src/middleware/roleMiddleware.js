// Middleware kiểm tra quyền truy cập theo vai trò
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Kiểm tra user đã được authenticate chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để tiếp tục'
        });
      }

      // Lấy danh sách vai trò của user
      const userRoles = req.user.roles.map(role => role.TenVaiTro);

      // Kiểm tra có vai trò được phép không
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này',
          requiredRoles: allowedRoles,
          userRoles: userRoles
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền truy cập',
        error: error.message
      });
    }
  };
};

module.exports = { authorize };