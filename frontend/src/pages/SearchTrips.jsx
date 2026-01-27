import { useState } from 'react';
import { Layout, Form, Select, DatePicker, Button, Card, Row, Col, Empty, Spin, Tag } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, CarOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import tripService from '../services/tripService';

const { Content } = Layout;
const { Option } = Select;

const SearchTrips = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState(null);

  // Lấy danh sách địa điểm
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: tripService.getLocations
  });

  // Tìm kiếm chuyến xe
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', searchParams],
    queryFn: () => tripService.searchTrips(searchParams),
    enabled: !!searchParams
  });

  const onSearch = (values) => {
    const params = {
      diemDi: values.diemDi,
      diemDen: values.diemDen,
      ngayDi: values.ngayDi.format('YYYY-MM-DD')
    };
    setSearchParams(params);
  };

  const handleSwapLocations = () => {
    const diemDi = form.getFieldValue('diemDi');
    const diemDen = form.getFieldValue('diemDen');
    form.setFieldsValue({
      diemDi: diemDen,
      diemDen: diemDi
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      
      {/* Hero Section với Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px 120px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 100,
          fontSize: 80,
          opacity: 0.1
        }}>
          🚌
        </div>
        <div style={{
          position: 'absolute',
          bottom: 30,
          right: 100,
          fontSize: 60,
          opacity: 0.1
        }}>
          🌸
        </div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: 42,
            fontWeight: 'bold',
            marginBottom: 10,
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            🚌 Nhà Xe Hoàng Hải
          </h1>
          <p style={{ 
            color: 'white', 
            fontSize: 20,
            opacity: 0.95,
            marginBottom: 0
          }}>
            CHẤT LƯỢNG LÀ DANH DỰ - Vững tin & Phát triển 24 năm
          </p>
        </div>
      </div>

      {/* Search Form - Floating */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '-80px auto 50px',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2
      }}>
        <Card 
          style={{ 
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            padding: '20px' 
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onSearch}
            initialValues={{
              ngayDi: dayjs()
            }}
          >
            <Row gutter={24} align="bottom">
              <Col xs={24} md={6}>
                <Form.Item
                  name="diemDi"
                  label={<span><EnvironmentOutlined /> Điểm đi</span>}
                  rules={[{ required: true, message: 'Chọn điểm đi!' }]}
                >
                  <Select
                    placeholder="Chọn điểm đi"
                    loading={locationsLoading}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {locationsData?.data?.map((location) => (
                      <Option key={location.MaDiaDiem} value={location.MaDiaDiem}>
                        {location.TenDiaDiem}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={1} style={{ textAlign: 'center' }}>
                <Button
                  icon={<SwapOutlined />}
                  onClick={handleSwapLocations}
                  style={{ marginBottom: 24 }}
                  shape="circle"
                  type="text"
                  size="large"
                />
              </Col>

              <Col xs={24} md={5}>
                <Form.Item
                  name="diemDen"
                  label={<span><EnvironmentOutlined /> Điểm đến</span>}
                  rules={[{ required: true, message: 'Chọn điểm đến!' }]}
                >
                  <Select
                    placeholder="Chọn điểm đến"
                    loading={locationsLoading}
                    showSearch
                    size="large"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {locationsData?.data?.map((location) => (
                      <Option key={location.MaDiaDiem} value={location.MaDiaDiem}>
                        {location.TenDiaDiem}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  name="ngayDi"
                  label={<span><ClockCircleOutlined /> Ngày đi</span>}
                  rules={[{ required: true, message: 'Chọn ngày đi!' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    size="large"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SearchOutlined />}
                    block
                    size="large"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderColor: '#764ba2',
                      height: 48,
                      fontSize: 16,
                      fontWeight: 'bold',
                      borderRadius: 8
                    }}
                  >
                    Tìm chuyến xe
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>

      {/* Results */}
      <Content style={{ padding: '0 20px 50px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {tripsLoading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px',
              background: 'white',
              borderRadius: 16
            }}>
              <Spin size="large" />
              <p style={{ marginTop: 20, color: '#999' }}>Đang tìm kiếm chuyến xe...</p>
            </div>
          ) : tripsData?.data && tripsData.data.length > 0 ? (
            <>
              <div style={{ 
                marginBottom: 20,
                padding: '15px 20px',
                background: 'white',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>
                  🎫 Tìm thấy <strong style={{ color: '#FF6B35' }}>{tripsData.count}</strong> chuyến xe
                </h2>
              </div>

              <Row gutter={[16, 16]}>
                {tripsData.data.map((trip) => (
                  <Col xs={24} key={trip.MaChuyen}>
                    <Card 
                      hoverable
                      onClick={() => navigate(`/booking/${trip.MaChuyen}`)}
                      style={{
                        borderRadius: 12,
                        border: '1px solid #e8e8e8',
                        transition: 'all 0.3s'
                      }}
                      bodyStyle={{ padding: '20px' }}
                    >
                      <Row gutter={16} align="middle">
                        {/* Thời gian */}
                        <Col xs={24} md={5}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: 28, 
                              fontWeight: 'bold',
                              color: '#667eea'
                            }}>
                              {dayjs(trip.ThoiGianKhoiHanh).format('HH:mm')}
                            </div>
                            <div style={{ color: '#999', fontSize: 13 }}>
                              {dayjs(trip.ThoiGianKhoiHanh).format('DD/MM/YYYY')}
                            </div>
                            <div style={{ 
                              marginTop: 8,
                              fontSize: 13,
                              color: '#666'
                            }}>
                              <ClockCircleOutlined /> {dayjs(trip.ThoiGianKhoiHanh).format('dddd')}
                            </div>
                          </div>
                        </Col>

                        {/* Tuyến đường */}
                        <Col xs={24} md={7}>
                          <div style={{ fontSize: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                              <EnvironmentOutlined style={{ color: '#52c41a' }} /> 
                              <strong> Đi: </strong>
                              {trip.route.diemDi.TenDiaDiem}
                            </div>
                            <div>
                              <EnvironmentOutlined style={{ color: '#f5222d' }} /> 
                              <strong> Đến: </strong>
                              {trip.route.diemDen.TenDiaDiem}
                            </div>
                          </div>
                        </Col>

                        {/* Thông tin xe */}
                        <Col xs={24} md={5}>
                          <div>
                            <Tag icon={<CarOutlined />} color="blue">
                              {trip.bus.LoaiXe}
                            </Tag>
                            <div style={{ 
                              marginTop: 8,
                              fontSize: 13,
                              color: '#666'
                            }}>
                              {trip.bus.SoLuongGhe} chỗ • BSX: {trip.bus.BienSoXe}
                            </div>
                          </div>
                        </Col>

                        {/* Số chỗ trống */}
                        <Col xs={24} md={3}>
                          <Tag 
                            color={trip.availableSeats > 10 ? 'green' : 'orange'}
                            style={{ fontSize: 14, padding: '5px 12px' }}
                          >
                            Còn {trip.availableSeats} chỗ
                          </Tag>
                        </Col>

                        {/* Giá + Button */}
                        <Col xs={24} md={4} style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: 24, 
                            color: '#667eea', 
                            fontWeight: 'bold',
                            marginBottom: 10
                          }}>
                            {formatCurrency(trip.route.GiaCoBan)}
                          </div>
                          <Button 
                            type="primary" 
                            block
                            size="large"
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderColor: '#ffffff',
                              borderRadius: 8,
                              fontWeight: 'bold'
                            }}
                          >
                            Đặt vé ngay
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : searchParams ? (
            <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 20px' }}>
              <Empty 
                description={
                  <div>
                    <h3>Không tìm thấy chuyến xe phù hợp</h3>
                    <p style={{ color: '#999' }}>
                      Vui lòng thử tìm kiếm với điều kiện khác
                    </p>
                  </div>
                }
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                imageStyle={{ height: 120 }}
              />
            </Card>
          ) : (
            <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 20px' }}>
              <Empty 
                description={
                  <div>
                    <h3>Chào mừng bạn đến với Nhà Xe Hoàng Hải</h3>
                    <p style={{ color: '#999', fontSize: 15 }}>
                      Vui lòng nhập thông tin điểm đi, điểm đến và ngày khởi hành để tìm chuyến xe phù hợp
                    </p>
                  </div>
                }
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                imageStyle={{ height: 150 }}
              />
            </Card>
          )}
        </div>
      </Content>

      <Footer />
    </Layout>
  );
};

export default SearchTrips;