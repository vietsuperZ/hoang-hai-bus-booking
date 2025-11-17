import { useState } from 'react';
import { Layout, Card, Descriptions, Form, Input, Button, Select, Row, Col, message, Spin, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import SeatSelection from '../components/customer/SeatSelection';
import tripService from '../services/tripService';
import bookingService from '../services/bookingService';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const BookingPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethods] = useState([
    { id: 1, name: 'Tiền mặt' },
    { id: 2, name: 'Chuyển khoản' },
    { id: 3, name: 'Ví điện tử' }
  ]);

  // Lấy thông tin chuyến xe
  const { data: tripData, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId)
  });

  // Lấy sơ đồ ghế
  const { data: seatsData, isLoading: seatsLoading } = useQuery({
    queryKey: ['trip-seats', tripId],
    queryFn: () => tripService.getTripSeats(tripId)
  });

  // Mutation đặt vé
  const bookingMutation = useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (data) => {
      Modal.success({
        title: 'Đặt vé thành công!',
        content: (
          <div>
            <p>Mã đặt vé: <strong>{data.data.MaBooking}</strong></p>
            <p>Vui lòng thanh toán trong vòng 10 phút để giữ chỗ.</p>
          </div>
        ),
        onOk: () => {
          navigate('/my-bookings');
        }
      });
    },
    onError: (error) => {
      message.error(error.message || 'Đặt vé thất bại');
    }
  });

  const trip = tripData?.data;
  const seatsInfo = seatsData?.data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  };

  const calculateTotal = () => {
    if (!trip) return 0;
    return selectedSeats.length * trip.route.GiaCoBan;
  };

  const onFinish = (values) => {
    if (selectedSeats.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 ghế');
      return;
    }

    // Tạo dữ liệu đặt vé
    const bookingData = {
      MaChuyen: parseInt(tripId),
      MaPTTT: values.paymentMethod,
      GhiChuKhachHang: values.note || '',
      seats: selectedSeats.map(seatCode => ({
        MaGhe: seatCode,
        TenHanhKhach: values.passengerName,
        SDT: values.passengerPhone,
        DiemDonChiTiet: values.pickupPoint || null,
        DiemTraChiTiet: values.dropoffPoint || null
      }))
    };

    bookingMutation.mutate(bookingData);
  };

  if (tripLoading || seatsLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
        </Content>
        <Footer />
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '50px' }}>
          <Card>
            <p>Không tìm thấy chuyến xe</p>
            <Button onClick={() => navigate('/search')}>Quay lại tìm kiếm</Button>
          </Card>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            {/* Thông tin chuyến xe */}
            <Col xs={24} lg={12}>
              <Card title="Thông tin chuyến xe" style={{ marginBottom: '20px' }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Điểm đi">
                    {trip.route.diemDi.TenDiaDiem} - {trip.route.diemDi.TenTinh}
                  </Descriptions.Item>
                  <Descriptions.Item label="Điểm đến">
                    {trip.route.diemDen.TenDiaDiem} - {trip.route.diemDen.TenTinh}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian khởi hành">
                    {formatDateTime(trip.ThoiGianKhoiHanh)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian dự kiến đến">
                    {formatDateTime(trip.ThoiGianDuKienDen)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại xe">
                    {trip.bus.LoaiXe}
                  </Descriptions.Item>
                  <Descriptions.Item label="Biển số xe">
                    {trip.bus.BienSoXe}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá vé">
                    <span style={{ fontSize: '18px', color: '#ff4d4f', fontWeight: 'bold' }}>
                      {formatCurrency(trip.route.GiaCoBan)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Chọn ghế */}
              <SeatSelection
                totalSeats={seatsInfo.totalSeats}
                bookedSeats={seatsInfo.bookedSeats}
                selectedSeats={selectedSeats}
                onSelectSeats={setSelectedSeats}
              />
            </Col>

            {/* Form đặt vé */}
            <Col xs={24} lg={12}>
              <Card title="Thông tin hành khách">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                >
                  <Form.Item
                    name="passengerName"
                    label="Họ và tên hành khách"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                  >
                    <Input placeholder="Nguyễn Văn A" />
                  </Form.Item>

                  <Form.Item
                    name="passengerPhone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
                    ]}
                  >
                    <Input placeholder="0987654321" />
                  </Form.Item>

                  <Form.Item
                    name="pickupPoint"
                    label="Điểm đón (tùy chọn)"
                  >
                    <Input placeholder="Địa chỉ cụ thể nơi đón" />
                  </Form.Item>

                  <Form.Item
                    name="dropoffPoint"
                    label="Điểm trả (tùy chọn)"
                  >
                    <Input placeholder="Địa chỉ cụ thể nơi trả" />
                  </Form.Item>

                  <Form.Item
                    name="paymentMethod"
                    label="Phương thức thanh toán"
                    rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán!' }]}
                  >
                    <Select placeholder="Chọn phương thức">
                      {paymentMethods.map(method => (
                        <Option key={method.id} value={method.id}>
                          {method.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="note"
                    label="Ghi chú"
                  >
                    <TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
                  </Form.Item>

                  {/* Tổng tiền */}
                  <Card style={{ background: '#e6f7ff', marginBottom: '20px' }}>
                    <Row justify="space-between">
                      <Col>
                        <strong>Số ghế đã chọn:</strong> {selectedSeats.length}
                      </Col>
                      <Col>
                        <strong>Tổng tiền:</strong>{' '}
                        <span style={{ fontSize: '20px', color: '#ff4d4f', fontWeight: 'bold' }}>
                          {formatCurrency(calculateTotal())}
                        </span>
                      </Col>
                    </Row>
                  </Card>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large"
                      loading={bookingMutation.isPending}
                      disabled={selectedSeats.length === 0}
                    >
                      Xác nhận đặt vé
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default BookingPage;