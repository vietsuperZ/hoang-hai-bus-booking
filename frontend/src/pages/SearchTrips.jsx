import { useState } from 'react';
import { Layout, Form, Select, DatePicker, Button, Card, Row, Col, Empty, Spin, Tag, message } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
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
  const [searchParams, setSearchParams] = useState(null);

  // Lấy danh sách địa điểm
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: tripService.getLocations
  });

  // Tìm kiếm chuyến xe
  const { data: tripsData, isLoading: tripsLoading, refetch } = useQuery({
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Search Form */}
          <Card style={{ marginBottom: '30px' }}>
            <Form
              layout="vertical"
              onFinish={onSearch}
              initialValues={{
                ngayDi: dayjs()
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="diemDi"
                    label="Điểm đi"
                    rules={[{ required: true, message: 'Vui lòng chọn điểm đi!' }]}
                  >
                    <Select
                      placeholder="Chọn điểm đi"
                      loading={locationsLoading}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {locationsData?.data?.map((location) => (
                        <Option key={location.MaDiaDiem} value={location.MaDiaDiem}>
                          {location.TenDiaDiem} - {location.TenTinh}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    name="diemDen"
                    label="Điểm đến"
                    rules={[{ required: true, message: 'Vui lòng chọn điểm đến!' }]}
                  >
                    <Select
                      placeholder="Chọn điểm đến"
                      loading={locationsLoading}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {locationsData?.data?.map((location) => (
                        <Option key={location.MaDiaDiem} value={location.MaDiaDiem}>
                          {location.TenDiaDiem} - {location.TenTinh}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    name="ngayDi"
                    label="Ngày đi"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày đi!' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item label=" ">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SearchOutlined />}
                      block
                      size="large"
                    >
                      Tìm chuyến
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Results */}
          {tripsLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : tripsData?.data && tripsData.data.length > 0 ? (
            <>
              <h2 style={{ marginBottom: '20px' }}>
                Tìm thấy {tripsData.count} chuyến xe
              </h2>
              <Row gutter={[16, 16]}>
                {tripsData.data.map((trip) => (
                  <Col xs={24} key={trip.MaChuyen}>
                    <Card 
                      hoverable
                      onClick={() => navigate(`/booking/${trip.MaChuyen}`)}
                    >
                      <Row gutter={16} align="middle">
                        <Col xs={24} md={6}>
                          <div>
                            <EnvironmentOutlined /> <strong>Điểm đi:</strong> {trip.route.diemDi.TenDiaDiem}
                          </div>
                          <div style={{ marginTop: '5px' }}>
                            <EnvironmentOutlined /> <strong>Điểm đến:</strong> {trip.route.diemDen.TenDiaDiem}
                          </div>
                        </Col>

                        <Col xs={24} md={5}>
                          <div>
                            <ClockCircleOutlined /> <strong>Khởi hành:</strong>
                          </div>
                          <div style={{ fontSize: '16px', color: '#1890ff' }}>
                            {formatDateTime(trip.ThoiGianKhoiHanh)}
                          </div>
                        </Col>

                        <Col xs={24} md={4}>
                          <div>
                            <CarOutlined /> <strong>Loại xe:</strong>
                          </div>
                          <div>{trip.bus.LoaiXe}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {trip.bus.SoLuongGhe} chỗ
                          </div>
                        </Col>

                        <Col xs={24} md={3}>
                          <Tag color="green">
                            Còn {trip.availableSeats} chỗ
                          </Tag>
                        </Col>

                        <Col xs={24} md={4}>
                          <div style={{ fontSize: '20px', color: '#ff4d4f', fontWeight: 'bold' }}>
                            {formatCurrency(trip.route.GiaCoBan)}
                          </div>
                        </Col>

                        <Col xs={24} md={2}>
                          <Button type="primary" block>
                            Đặt vé
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : searchParams ? (
            <Empty 
              description="Không tìm thấy chuyến xe phù hợp"
              style={{ padding: '50px' }}
            />
          ) : (
            <Empty 
              description="Vui lòng chọn điểm đi, điểm đến và ngày đi để tìm chuyến"
              style={{ padding: '50px' }}
            />
          )}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default SearchTrips;