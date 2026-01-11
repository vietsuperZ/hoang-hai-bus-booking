import { useState, useEffect } from 'react';
import { Layout, Card, Descriptions, Form, Input, Button, Select, Row, Col, message, Spin, Modal, Space, Typography } from 'antd';
import { CheckCircleOutlined, CopyOutlined, BankOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import SeatSelection from '../components/customer/SeatSelection';
import tripService from '../services/tripService';
import bookingService from '../services/bookingService';
import api from '../services/api'; // ← THÊM IMPORT

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const BookingPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // STATE: Modal thành công
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  
  // STATE: Modal chuyển khoản
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [transferInfo, setTransferInfo] = useState({ amount: 0, code: '' });
  const [countdown, setCountdown] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState(null); // ← Chuyển lên đây
  
  // Thông tin tài khoản ngân hàng
  const bankInfo = {
    bankName: 'MB Bank',
    accountNumber: '0123456789',
    accountName: 'CONG TY TNHH XE KHACH HOANG HAI',
    branch: 'Chi nhánh Đà Nẵng',
    qrImage: '/images/1767528207379.png' // ← Ảnh QR thật
  };
  
  const [paymentMethods] = useState([
    { id: 2, name: 'Chuyển khoản' }
  ]);

  // Lấy thông tin chuyến xe
  const { data: tripData, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId)
  });

  // Lấy sơ đồ ghế
  const { data: seatsData, isLoading: seatsLoading, refetch: refetchSeats } = useQuery({
    queryKey: ['trip-seats', tripId],
    queryFn: () => tripService.getTripSeats(tripId)
  });

  // Mutation đặt vé
  const bookingMutation = useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (response) => {
      const code = response?.data?.MaBooking || 'N/A';
      const amount = calculateTotal();
      
      setBookingCode(code);
      setTransferInfo({ amount, code });
      setSelectedBooking(response?.data); // ← Lưu booking data
      setCountdown(10); // ← Reset countdown
      setIsTransferModalVisible(true);
      
      // Reset form và seats
      form.resetFields();
      setSelectedSeats([]);
      refetchSeats();
    },
    onError: (error) => {
      message.error(error?.message || 'Đặt vé thất bại. Vui lòng thử lại.');
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

  // Copy text
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Đã copy!');
  };

  // Tự động duyệt thanh toán (GIẢ LẬP - Thay webhook thật)
  const handleAutoApprove = async () => {
    try {
      console.log('🔥 Auto-approving:', selectedBooking?.MaDon);
      
      // Gọi API duyệt tự động
      // await api.put(`/bookings/${selectedBooking?.MaDon}/auto-approve`);
      
      message.destroy(); // Xóa message loading
      message.success('✅ Đã nhận được thanh toán!', 3);
      
      setIsTransferModalVisible(false);
      
      // Chờ 1.5s để user đọc message rồi mới redirect
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Auto-approve error:', error);
      message.error('Lỗi xác nhận thanh toán');
    }
  };

  // Countdown effect - Tự động thanh toán sau 10s (GIẢ LẬP)
  useEffect(() => {
    let timer;
    
    console.log('⏱️ Countdown:', countdown, 'Modal:', isTransferModalVisible);
    
    if (isTransferModalVisible && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isTransferModalVisible && countdown === 0) {
      // Hết thời gian → Gọi API auto-approve (GIẢ LẬP)
      console.log('🚀 Triggering auto-approve!');
      handleAutoApprove();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTransferModalVisible, countdown, selectedBooking, navigate]);

  // Xử lý đóng modal chuyển khoản
  const handleTransferModalClose = () => {
    setIsTransferModalVisible(false);
    navigate('/my-bookings');
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
                    initialValue={2}
                    hidden
                  >
                    <Input type="hidden" />
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

      {/* MODAL CHUYỂN KHOẢN */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span>Thông tin chuyển khoản</span>
          </Space>
        }
        open={isTransferModalVisible}
        onCancel={() => setIsTransferModalVisible(false)}
        footer={null}
        width={600}
        centered
        mask={false}
        maskClosable={false}
        closable={true}
      >
        <div style={{ padding: '20px 0' }}>
          {/* Countdown Banner */}
          <Card 
            style={{ 
              marginBottom: '20px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '16px', marginBottom: '5px' }}>
                ⏱️ Đang chờ xác nhận thanh toán
              </div>
              {/* <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {countdown}s
              </div> */}
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Hệ thống sẽ tự động xác nhận sau khi nhận được tiền
              </div>
            </div>
          </Card>

          {/* QR Code */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img 
              src={bankInfo.qrImage}
              alt="QR Code" 
              style={{ 
                maxWidth: '300px',
                width: '100%',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                padding: '10px',
                background: '#fff'
              }}
              onError={(e) => {
                console.error('QR Code load error');
                // Tạo placeholder text thay vì load ảnh nữa
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML += '<div style="width:300px;height:300px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;border-radius:8px;color:#999;font-size:16px;">QR Code<br/>Chưa upload</div>';
              }}
            />
            <Paragraph style={{ marginTop: '10px', color: '#666' }}>
              Quét mã QR để chuyển khoản nhanh
            </Paragraph>
          </div>

          {/* Thông tin tài khoản */}
          <Card style={{ background: '#fafafa' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Ngân hàng:</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>{bankInfo.bankName}</Title>
                </div>
              </div>

              <div>
                <Text type="secondary">Số tài khoản:</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>{bankInfo.accountNumber}</Title>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyToClipboard(bankInfo.accountNumber)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Text type="secondary">Chủ tài khoản:</Text>
                <Title level={5} style={{ margin: 0 }}>{bankInfo.accountName}</Title>
              </div>

              <div>
                <Text type="secondary">Số tiền:</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                    {formatCurrency(transferInfo.amount)}
                  </Title>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyToClipboard(transferInfo.amount.toString())}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Text type="secondary">Nội dung chuyển khoản:</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                    DV {transferInfo.code}
                  </Title>
                  <Button 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyToClipboard(`DV ${transferInfo.code}`)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </Space>
          </Card>

          {/* Lưu ý */}
          <Card 
            style={{ marginTop: '20px', background: '#fff7e6', border: '1px solid #ffd591' }}
            size="small"
          >
            <Text strong style={{ color: '#d46b08' }}>⚠️ Lưu ý quan trọng:</Text>
            <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#666' }}>
              <li>Vui lòng chuyển <strong>ĐÚNG số tiền</strong> và <strong>ĐÚNG nội dung</strong></li>
              <li>Hệ thống sẽ tự động xác nhận khi nhận được tiền</li>
              <li>Nếu có vấn đề, vui lòng liên hệ: <strong>1900 xxxx</strong></li>
            </ul>
          </Card>
        </div>
      </Modal>
    </Layout>
  );
};

export default BookingPage;