import { useState } from 'react'; 
import { Layout, Card, Table, Tag, Button, message, Modal, Descriptions, Empty, Spin } from 'antd';
import { EyeOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import bookingService from '../services/bookingService';

const { Content } = Layout;

const MyBookings = () => {
  const queryClient = useQueryClient();

  // STATE: Quản lý Modal Chi tiết
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // STATE: Quản lý Modal Hủy vé
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelBookingInfo, setCancelBookingInfo] = useState(null);

  const defaultText = '---'; 

  // Mutation hủy vé
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

  // Lấy lịch sử đặt vé
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingService.getMyBookings
  });

  // Lọc chỉ hiển thị vé chưa hủy
  const activeBookings = bookingsData?.data?.filter(booking => {
    return !booking.tickets?.every(t => t.TrangThaiVe === 2);
  }) || [];

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0; 
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };

  const formatDateTime = (dateTime) => {
    return dateTime ? dayjs(dateTime).format('DD/MM/YYYY HH:mm') : defaultText;
  };

  const getPaymentStatusTag = (status) => {
    if (status === 1) {
      return <Tag icon={<CheckCircleOutlined />} color="success">Đã thanh toán</Tag>;
    }
    return <Tag icon={<ClockCircleOutlined />} color="warning">Chưa thanh toán</Tag>;
  };

  // LOGIC MODAL CHI TIẾT
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
            {getPaymentStatusTag(booking.TrangThaiTT)}
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

  // LOGIC MODAL HỦY VÉ
  const handleCancelBooking = (bookingId, bookingCode) => {
    setCancelBookingInfo({ MaDon: bookingId, MaBooking: bookingCode });
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

  // CỘT BẢNG
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
      render: (status) => getPaymentStatusTag(status)
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
          {record.TrangThaiTT === 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelBooking(record.MaDon, record.MaBooking)}
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

  // JSX RENDER
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
            {activeBookings.length > 0 ? (
              <Table
                columns={columns}
                dataSource={activeBookings}
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
      
      {/* MODAL CHI TIẾT */}
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

      {/* MODAL HỦY VÉ */}
      <Modal
        title="Xác nhận hủy vé"
        open={isCancelModalVisible}
        onCancel={handleCancelModalClose}
        footer={[
          <Button key="back" onClick={handleCancelModalClose} disabled={cancelMutation.isPending}>
            Quay lại
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger 
            loading={cancelMutation.isPending} 
            onClick={handleConfirmCancel}
          >
            Hủy vé
          </Button>,
        ]}
        width={400}
        mask={false}
        maskClosable={false}
      >
        {cancelBookingInfo ? (
          <p>Bạn có chắc muốn hủy đơn đặt vé <strong>{cancelBookingInfo.MaBooking}</strong>?</p>
        ) : (
          <Spin />
        )}
      </Modal>
    </Layout>
  );
};

export default MyBookings;