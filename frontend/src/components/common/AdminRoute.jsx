import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra có role Admin hoặc Nhân viên không
  const hasAccess = user?.roles?.some(
    (role) => role.TenVaiTro === 'Admin' || role.TenVaiTro === 'Nhân viên'
  );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;