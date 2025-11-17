// frontend/src/pages/SearchTrips.jsx
import { Layout } from 'antd';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const { Content } = Layout;

const MyBookings = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px' }}>
        <h1>Tìm kiếm chuyến xe (Coming soon...)</h1>
      </Content>
      <Footer />
    </Layout>
  );
};

export default MyBookings;