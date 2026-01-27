import { Layout, Button, Card, Row, Col, Rate, Avatar, Spin } from 'antd';
import { SafetyOutlined, ClockCircleOutlined, CustomerServiceOutlined, DollarOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import api from '../services/api';

const { Content } = Layout;

const Home = () => {
  const navigate = useNavigate();

  // Lấy đánh giá mới nhất
  const { data: latestReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['latest-reviews'],
    queryFn: async () => {
      try {
        // Lấy tất cả đánh giá, sort theo ngày mới nhất
        const response = await api.get('/reviews/latest'); // Cần tạo API này
        return response.data || [];
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
    }
  });

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

        {/* Reviews Section - MỚI */}
<div style={{ padding: '80px 50px', background: 'white' }}>
  <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '10px' }}>
    <StarOutlined style={{ color: '#faad14' }} /> Đánh giá từ khách hàng
  </h2>
  <p style={{ textAlign: 'center', fontSize: '16px', color: '#666', marginBottom: '50px' }}>
    Hơn 10,000+ khách hàng hài lòng với dịch vụ của chúng tôi
  </p>
  
  {reviewsLoading ? (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Spin size="large" />
    </div>
  ) : latestReviews && latestReviews.length > 0 ? (
    <Row gutter={[24, 24]} justify="center">
      {latestReviews.slice(0, 6).map((review, index) => (
        <Col xs={24} sm={12} md={8} key={index}>
          <Card 
            style={{ 
              borderRadius: '12px',
              height: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              border: '1px solid #f0f0f0'
            }}
            hoverable
          >
            {/* Header với avatar và tên */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <Avatar 
                size={48}
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: '#1890ff',
                  marginRight: '12px'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '15px',
                  marginBottom: '4px'
                }}>
                  {review.HoTen}
                </div>
                <Rate 
                  disabled 
                  value={review.DiemSo} 
                  style={{ fontSize: 14 }} 
                />
              </div>
            </div>

            {/* Thông tin chuyến xe */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ 
                fontSize: '13px', 
                color: '#1890ff',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                🚌 {review.TenTuyen}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {dayjs(review.ThoiGianKhoiHanh).format('DD/MM/YYYY')}
              </div>
            </div>

            {/* Nội dung đánh giá */}
            <p style={{ 
              color: '#666', 
              fontSize: '14px',
              minHeight: '60px',
              lineHeight: '1.6',
              fontStyle: review.NoiDung ? 'normal' : 'italic',
              marginBottom: '12px'
            }}>
              {review.NoiDung && review.NoiDung.length > 100 
                ? `"${review.NoiDung.substring(0, 100)}..."` 
                : review.NoiDung 
                  ? `"${review.NoiDung}"`
                  : 'Khách hàng hài lòng với dịch vụ'}
            </p>

            {/* Ngày đánh giá */}
            <div style={{ 
              fontSize: '12px', 
              color: '#999',
              textAlign: 'right'
            }}>
              📅 {dayjs(review.NgayDanhGia).format('DD/MM/YYYY')}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  ) : (
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 20px',
      background: '#fafafa',
      borderRadius: '12px'
    }}>
      <StarOutlined style={{ 
        fontSize: '64px', 
        marginBottom: '20px',
        color: '#faad14'
      }} />
      <h3 style={{ 
        fontSize: '20px', 
        color: '#666',
        marginBottom: '10px'
      }}>
        Chưa có đánh giá nào
      </h3>
      <p style={{ color: '#999' }}>
        Hãy là người đầu tiên đánh giá dịch vụ của chúng tôi!
      </p>
      <Button 
        type="primary" 
        size="large"
        style={{ marginTop: '20px' }}
        onClick={() => navigate('/search')}
      >
        Đặt vé ngay
      </Button>
    </div>
  )}
</div>

        {/* Popular Routes Section */}
        <div style={{ padding: '80px 50px', background: '#f0f2f5' }}>
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