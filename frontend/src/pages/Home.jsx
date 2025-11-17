import { Layout, Button, Card, Row, Col } from 'antd';
import { SafetyOutlined, ClockCircleOutlined, CustomerServiceOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const { Content } = Layout;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: 'An toàn',
      description: 'Đội ngũ tài xế chuyên nghiệp, xe được bảo dưỡng định kỳ'
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: 'Đúng giờ',
      description: 'Cam kết xuất bến đúng giờ, đảm bảo lịch trình'
    },
    {
      icon: <CustomerServiceOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ chăm sóc khách hàng tận tình, chu đáo'
    },
    {
      icon: <DollarOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
      title: 'Giá cả hợp lý',
      description: 'Giá vé cạnh tranh, nhiều ưu đãi hấp dẫn'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      
      {/* Hero Section */}
      <Content>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '100px 50px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: 'white' }}>
            🚌 Nhà Xe Hoàng Hải
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '40px', color: 'rgba(255,255,255,0.9)' }}>
            Dịch vụ xe khách uy tín, chất lượng hàng đầu miền Trung
          </p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/search')}
            style={{ 
              height: '50px', 
              fontSize: '18px',
              padding: '0 50px',
              background: 'white',
              color: '#667eea',
              border: 'none'
            }}
          >
            Đặt vé ngay
          </Button>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 50px', background: '#f0f2f5' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px' }}>
            Tại sao chọn chúng tôi?
          </h2>
          <Row gutter={[32, 32]} justify="center">
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    textAlign: 'center', 
                    height: '100%',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#666' }}>
                    {feature.description}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Popular Routes Section */}
        <div style={{ padding: '80px 50px', background: 'white' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px' }}>
            Tuyến đường phổ biến
          </h2>
          <Row gutter={[24, 24]} justify="center">
            {[
              { from: 'Đà Nẵng', to: 'Huế', price: '150.000đ' },
              { from: 'Đà Nẵng', to: 'Hội An', price: '50.000đ' },
              { from: 'Đà Nẵng', to: 'Quảng Ngãi', price: '120.000đ' },
              { from: 'Huế', to: 'Đà Nẵng', price: '150.000đ' }
            ].map((route, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  hoverable
                  onClick={() => navigate('/search')}
                  style={{ borderRadius: '12px' }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                    <strong>{route.from}</strong> → <strong>{route.to}</strong>
                  </div>
                  <div style={{ fontSize: '20px', color: '#1890ff', fontWeight: 'bold' }}>
                    Từ {route.price}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      <Footer />
    </Layout>
  );
};

export default Home;