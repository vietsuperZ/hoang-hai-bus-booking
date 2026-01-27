import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, HistoryOutlined, FileTextOutlined, CarOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from '../NotificationBell';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  // Kiểm tra roles
  const isAdmin = user?.roles?.some(r => r.TenVaiTro === 'Admin');
  const isEmployee = user?.roles?.some(r => r.TenVaiTro === 'Nhân viên');
  const isDriver = user?.roles?.some(r => r.TenVaiTro === 'Tài xế');
  const isCustomer = !isAdmin && !isEmployee && !isDriver; // ← Thêm biến này

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile'),
    },
    // ===== CHỈ HIỆN "VÉ CỦA TÔI" CHO KHÁCH HÀNG =====
    ...(isCustomer
      ? [{
          key: 'my-bookings',
          icon: <HistoryOutlined />,
          label: 'Vé của tôi',
          onClick: () => navigate('/my-bookings'),
        }]
      : []
    ),
    ...(isAdmin
      ? [{
          key: 'admin',
          icon: <DashboardOutlined />,
          label: 'Quản trị',
          onClick: () => navigate('/admin'),
        }]
      : []
    ),
    ...(isEmployee && !isAdmin
      ? [{
          key: 'employee',
          icon: <FileTextOutlined />,
          label: 'Quản lý vé',
          onClick: () => navigate('/employee'),
        }]
      : []
    ),
    ...(isDriver
      ? [{
          key: 'driver',
          icon: <CarOutlined />,
          label: 'Lịch làm việc',
          onClick: () => navigate('/driver'),
        }]
      : []
    ),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const getSelectedKey = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/search')) return 'search';
    if (location.pathname.startsWith('/employee/trips')) return 'employee-trips';
    if (location.pathname.startsWith('/employee')) return 'employee';
    if (location.pathname.startsWith('/driver')) return 'driver';
    return '';
  };

  // ===== MENU CHÍNH ĐỘNG THEO ROLE =====
  const getMainMenuItems = () => {
    const items = [
      <Menu.Item key="home">
        <Link to="/">Trang chủ</Link>
      </Menu.Item>
    ];

    // Menu cho khách hàng
    if (isCustomer) {
      items.push(
        <Menu.Item key="search">
          <Link to="/search">Tra cứu chuyến</Link>
        </Menu.Item>
      );
    }

    // Menu cho nhân viên
    if (isEmployee) {
      items.push(
        <Menu.Item key="employee-trips">
          <Link to="/employee/trips">Quản lý chuyến xe</Link>
        </Menu.Item>
      );
      items.push(
        <Menu.Item key="employee">
          <Link to="/employee">Quản lý đơn vé</Link>
        </Menu.Item>
      );
    }

    // Menu cho tài xế
    if (isDriver) {
      items.push(
        <Menu.Item key="driver">
          <Link to="/driver">Lịch làm việc</Link>
        </Menu.Item>
      );
    }

    // Menu cho admin
    if (isAdmin) {
      items.push(
        <Menu.Item key="admin">
          <Link to="/admin">Quản trị</Link>
        </Menu.Item>
      );
    }

    return items;
  };

  return (
    <AntHeader style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 50px',
      background: '#001529',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Link 
          to="/" 
          style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginRight: '50px',
            textDecoration: 'none'
          }}
        >
          🚌 Hoàng Hải
        </Link>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent' }}
        >
          {getMainMenuItems()}
        </Menu>
      </div>

      <div>
        {isAuthenticated ? (
          <Space size="large">
            <NotificationBell />
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer', color: 'white' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
                <span>{user?.HoTen}</span>
              </Space>
            </Dropdown>
          </Space>
        ) : (
          <Space>
            <Button onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
            <Button type="primary" onClick={() => navigate('/register')}>
              Đăng ký
            </Button>
          </Space>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;