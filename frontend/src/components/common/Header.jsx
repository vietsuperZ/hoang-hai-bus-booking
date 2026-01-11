import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, HistoryOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

// 1. Import component thông báo
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


  
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'my-bookings',
      icon: <HistoryOutlined />,
      label: 'Vé của tôi',
      onClick: () => navigate('/my-bookings'),
    },
    ...(user?.roles?.some(r => r.TenVaiTro === 'Admin')
      ? [{
          key: 'admin',
          icon: <DashboardOutlined />,
          label: 'Quản trị',
          onClick: () => navigate('/admin'),
        }]
      : []
    ),
    ...(user?.roles?.some(r => r.TenVaiTro === 'Nhân viên') && !user?.roles?.some(r => r.TenVaiTro === 'Admin')
      ? [{
          key: 'employee',
          icon: <FileTextOutlined />,
          label: 'Quản lý vé',
          onClick: () => navigate('/employee'),
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
    return '';
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
          <Menu.Item key="home">
            <Link to="/">Trang chủ</Link>
          </Menu.Item>
          <Menu.Item key="search">
            <Link to="/search">Tra cứu chuyến</Link>
          </Menu.Item>
        </Menu>
      </div>

      <div>
        {isAuthenticated ? (
          // 2. Sử dụng Space để đặt Thông báo cạnh Avatar
          <Space size="large">
            
            {/* COMPONENT THÔNG BÁO */}
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