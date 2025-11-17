import { Layout, Card, Descriptions } from 'antd';
import { useSelector } from 'react-redux';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const { Content } = Layout;

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card title="Thông tin cá nhân">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Họ và tên">{user?.HoTen}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.Email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{user?.SDT}</Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                {user?.roles?.map(r => r.TenVaiTro).join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {user?.TrangThai === 1 ? 'Hoạt động' : 'Bị khóa'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default Profile;