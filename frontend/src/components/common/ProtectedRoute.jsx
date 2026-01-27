import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, allowedRoles = [], requiredRole }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check single required role (cho employee/trips)
  if (requiredRole) {
    const hasRole = user.roles?.some(role => role.TenVaiTro === requiredRole);
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Check multiple allowed roles (cho driver)
  if (allowedRoles.length > 0) {
    const userRoles = user.roles?.map(r => r.TenVaiTro) || [];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;