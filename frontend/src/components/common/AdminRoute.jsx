import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // CHỈ CHO PHÉP ADMIN - KHÔNG CHO NHÂN VIÊN
  const isAdmin = user?.roles?.some(
    (role) => role.TenVaiTro === 'Admin'
  );

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;