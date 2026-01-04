import { useState } from 'react'; 
import { Layout, Card, Table, Tag, Button, message, Modal, Descriptions, Empty, Spin, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import bookingService from '../services/bookingService';

const { Content } = Layout;
const { Text } = Typography;

const MyBookings = () => {
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelBookingInfo, setCancelBookingInfo] = useState(null);

  const defaultText = '---'; 

  const cancelMutation = useMutation({
    mutationFn: bookingService.cancelBooking,
    onSuccess: () => {
      message.success('Hủy vé thành công!');
      queryClient.invalidateQueries(['my-bookings']);
      setIsCancelModalVisible(false);
      setCancelBookingInfo(null);
    },
    onError: (error) => {
      message.error(error.message || 'Hủy vé thất bại');
      setIsCancelModalVisible(false);
      setCancelBookingInfo(null);
    }
  });

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingService.getMyBookings
  });

  // Hiển thị TẤT CẢ đơn (kể cả đã hủy) - Đây là lịch sử
  const bookings = bookingsData?.data || [];

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0; 
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };

  const formatDateTime = (dateTime) => {
    return dateTime ? dayjs(dateTime).format('DD/MM/YYYY HH:mm') : defaultText;
  };

  const getPaymentStatusTag = (status, booking) => {
    const statusMap = {
      0: { text: 'Chưa thanh toán', icon: <ClockCircleOutlined />, color: 'default' },
      1: { text: 'Đã thanh toán', icon: <CheckCircleOutlined />, color: 'success' },
      2: { text: 'Chờ duyệt', icon: <ClockCircleOutlined />, color: 'warning' },
      3: { 
        // Nếu có NgayThanhToan → Đã TT rồi mới hủy → Đã hoàn tiền
        // Nếu không có → Chưa TT rồi hủy → Đã hủy
        text: booking?.NgayThanhToan ? 'Đã hoàn tiền' : 'Đã hủy', 
        icon: <CloseCircleOutlined />, 
        color: booking?.NgayThanhToan ? 'error' : 'default'
      }
    };
    const s = statusMap[status] || statusMap[0];
    return <Tag icon={s.icon} color={s.color}>{s.text}</Tag>;
  };

  const showBookingDetail = (booking) => {
    setSelectedBooking(booking);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBooking(null);
  };

  const renderBookingDetailContent = () => {
    if (!selectedBooking) return <Spin size="large" />;

    const booking = selectedBooking;
    const firstTicket = booking.tickets?.[0] || {};
    const trip = firstTicket.trip || {};
    const route = trip.route || {};
    const diemDi = route.diemDi || {};
    const diemDen = route.diemDen || {};
    const bus = trip.bus || {};
    const paymentMethod = booking.paymentMethod || {};

    return (
      <div style={{ marginTop: '20px' }}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Mã đặt vé">
            <strong style={{ color: '#1890ff' }}>{booking.MaBooking || defaultText}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày đặt">
            {formatDateTime(booking.NgayDat)}
          </Descriptions.Item>
          <Descriptions.Item label="Tuyến đường">
            {`${diemDi.TenDiaDiem || defaultText} → ${diemDen.TenDiaDiem || defaultText}`}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian khởi hành">
            {formatDateTime(trip.ThoiGianKhoiHanh)}
          </Descriptions.Item>
          <Descriptions.Item label="Loại xe">
            {bus.LoaiXe ? `${bus.LoaiXe} - ${bus.BienSoXe || defaultText}` : defaultText}
          </Descriptions.Item>
          <Descriptions.Item label="Số ghế đã đặt">
            {booking.tickets?.map(t => t.MaGhe).join(', ') || defaultText}
          </Descriptions.Item>
          <Descriptions.Item label="Tên hành khách">
            {firstTicket.TenHanhKhach || defaultText}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {firstTicket.SDT || defaultText}
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            {paymentMethod.TenPTTT || defaultText}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái thanh toán">
            {getPaymentStatusTag(booking.TrangThaiTT, booking)}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            <strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
              {formatCurrency(booking.TongTien)}
            </strong>
          </Descriptions.Item>
          {booking.GhiChuKhachHang && (
            <Descriptions.Item label="Ghi chú">
              {booking.GhiChuKhachHang}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    );
  };

  const handleCancelBooking = (bookingId, bookingCode, booking) => {
    // Kiểm tra đã thanh toán chưa
    const isPaid = booking?.TrangThaiTT === 1 || booking?.NgayThanhToan;
    
    setCancelBookingInfo({ 
      MaDon: bookingId, 
      MaBooking: bookingCode,
      isPaid: isPaid,
      TongTien: booking?.TongTien || 0
    });
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = () => {
    if (cancelBookingInfo) {
      cancelMutation.mutate(cancelBookingInfo.MaDon); 
    }
  };

  const handleCancelModalClose = () => {
    setIsCancelModalVisible(false);
    setCancelBookingInfo(null);
  };

  const columns = [
    {
      title: 'Mã đặt vé',
      dataIndex: 'MaBooking',
      key: 'MaBooking',
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: 'Tuyến đường',
      key: 'route',
      render: (_, record) => {
        const firstTicket = record.tickets?.[0] || {};
        const route = firstTicket.trip?.route || {};
        const diemDi = route.diemDi || {};
        const diemDen = route.diemDen || {};
        return (
          <div>
            <div>{diemDi.TenDiaDiem || defaultText}</div>
            <div>↓</div>
            <div>{diemDen.TenDiaDiem || defaultText}</div>
          </div>
        );
      }
    },
    {
      title: 'Ngày đi',
      key: 'departureTime',
      render: (_, record) => formatDateTime(record.tickets?.[0]?.trip?.ThoiGianKhoiHanh)
    },
    {
      title: 'Số ghế',
      key: 'seats',
      render: (_, record) => (
        <div>
          {record.tickets?.map(t => (
            <Tag key={t.MaVe} color="blue">{t.MaGhe}</Tag>
          )) || defaultText}
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TongTien',
      key: 'TongTien',
      render: (amount) => (
        <strong style={{ color: '#ff4d4f' }}>{formatCurrency(amount)}</strong>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThaiTT',
      key: 'TrangThaiTT',
      render: (status, record) => getPaymentStatusTag(status, record)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => showBookingDetail(record)} 
            size="small"
          >
            Xem
          </Button>
          
          {/* Chỉ ẨN nút Hủy khi: Đã hủy/hoàn tiền (3) */}
          {record.TrangThaiTT !== 3 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelBooking(record.MaDon, record.MaBooking, record)}
              loading={cancelMutation.isPending}
              size="small"
            >
              Hủy
            </Button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Card 
            title={
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                📋 Lịch sử đặt vé
              </div>
            }
          >
            {bookings.length > 0 ? (
              <Table
                columns={columns}
                dataSource={bookings}
                rowKey="MaDon"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Tổng ${total} đơn đặt vé`
                }}
              />
            ) : (
              <Empty 
                description="Bạn chưa có đơn đặt vé nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" href="/search">
                  Tìm chuyến xe ngay
                </Button>
              </Empty>
            )}
          </Card>
        </div>
      </Content>
      <Footer />
      
      <Modal
        title="Chi tiết đơn đặt vé"
        open={isModalVisible} 
        onCancel={handleModalClose}
        footer={null} 
        width={700}
        mask={false}
        maskClosable={false}
      >
        {renderBookingDetailContent()}
      </Modal>

      {/* MODAL HỦY VÉ / YÊU CẦU HOÀN TIỀN */}
      <Modal
        title={
          cancelBookingInfo?.isPaid 
            ? "⚠️ Xác nhận yêu cầu hoàn tiền" 
            : "Xác nhận hủy vé"
        }
        open={isCancelModalVisible}
        onCancel={handleCancelModalClose}
        footer={[
          <Button 
            key="back" 
            onClick={handleCancelModalClose} 
            disabled={cancelMutation.isPending}
          >
            Quay lại
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger 
            loading={cancelMutation.isPending} 
            onClick={handleConfirmCancel}
          >
            {cancelBookingInfo?.isPaid ? '✅ Gửi yêu cầu hoàn tiền' : 'Hủy vé'}
          </Button>,
        ]}
        width={500}
        mask={false}
        maskClosable={false}
      >
        {cancelBookingInfo ? (
          <div>
            <p style={{ fontSize: '15px', marginBottom: '16px' }}>
              Bạn có chắc muốn hủy đơn đặt vé <strong style={{ color: '#1890ff' }}>{cancelBookingInfo.MaBooking}</strong>?
            </p>
            
            {/* Nếu ĐÃ THANH TOÁN → Hiện thông tin hoàn tiền */}
            {cancelBookingInfo.isPaid ? (
              <div style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '12px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#d46b08', fontSize: '15px' }}>
                    💰 Thông tin hoàn tiền:
                  </strong>
                </div>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '20px',
                  listStyle: 'disc'
                }}>
                  <li style={{ marginBottom: '8px' }}>
                    Số tiền hoàn: <strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                      {formatCurrency(cancelBookingInfo.TongTien)}
                    </strong>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    Yêu cầu sẽ được gửi đến nhân viên xử lý
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    Thời gian xử lý: <strong>1-3 ngày làm việc</strong>
                  </li>
                  <li>
                    Tiền sẽ được hoàn về tài khoản của bạn
                  </li>
                </ul>
              </div>
            ) : (
              // Nếu CHƯA THANH TOÁN → Chỉ xác nhận hủy
              <div style={{
                background: '#f6f6f6',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                color: '#666'
              }}>
                <Text>Đơn hàng sẽ được hủy và ghế sẽ được giải phóng.</Text>
              </div>
            )}
          </div>
        ) : (
          <Spin />
        )}
      </Modal>
    </Layout>
  );
};

export default MyBookings;