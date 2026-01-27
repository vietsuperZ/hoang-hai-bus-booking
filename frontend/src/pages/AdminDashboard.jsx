import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
  StarOutlined
} from '@ant-design/icons';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/common/Header';
import TripManagement from '../components/admin/TripManagement';
import RouteManagement from '../components/admin/RouteManagement';
import BusManagement from '../components/admin/BusManagement';
import LocationManagement from '../components/admin/LocationManagement';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import UserManagement from '../components/admin/UserManagement';
import DashboardOverview from '../components/admin/DashboardOverview';
import ReviewManagement from '../components/admin/ReviewManagement';

const { Sider, Content } = Layout;

const AdminDashboard = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Menu items
  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Tổng quan</Link>
    },
    {
      key: '/admin/trips',
      icon: <CarOutlined />,
      label: <Link to="/admin/trips">Quản lý Chuyến xe</Link>
    },
    {
      key: '/admin/routes',
      icon: <SwapOutlined />,
      label: <Link to="/admin/routes">Quản lý Tuyến đường</Link>
    },
    {
      key: '/admin/buses',
      icon: <CarOutlined />,
      label: <Link to="/admin/buses">Quản lý Xe</Link>
    },
    {
      key: '/admin/locations',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/locations">Quản lý Địa điểm</Link>
    },
    {
      key: '/admin/employees',
      icon: <TeamOutlined />,
      label: <Link to="/admin/employees">Quản lý Nhân viên</Link>
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: <Link to="/admin/users">Quản lý Tài khoản</Link>
    },
    {
      key: '/admin/reviews', // ← FIX: Thêm đúng format
      icon: <StarOutlined />,
      label: <Link to="/admin/reviews">Quản lý Đánh giá</Link>
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      
      <Layout>
        {/* Sidebar */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={250}
          style={{
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            left: 0,
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderRight: 0, paddingTop: '10px' }}
          />
        </Sider>

        {/* Main Content */}
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: '8px'
            }}
          >
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="trips" element={<TripManagement />} />
              <Route path="routes" element={<RouteManagement />} />
              <Route path="buses" element={<BusManagement />} />
              <Route path="locations" element={<LocationManagement />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="reviews" element={<ReviewManagement />} /> {/* ← THÊM ROUTE */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;