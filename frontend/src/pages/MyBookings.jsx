import { useState } from 'react';
import { 
  Layout, Card, Table, Button, Tag, Space, Drawer, Descriptions, 
  message, Modal, Form, Input 
} from 'antd';
import { 
  EyeOutlined, StarOutlined, EditOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ReviewModal from '../components/ReviewModal';
import api from '../services/api';

const { Content } = Layout;

const MyBookings = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedTripForReview, setSelectedTripForReview] = useState(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [ticketToUpdate, setTicketToUpdate] = useState(null);
const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
const [bookingToCancel, setBookingToCancel] = useState(null);
  // Fetch user's bookings
  // Fetch user's bookings
const { data: bookingsData, isLoading } = useQuery({
  queryKey: ['my-bookings'],
  queryFn: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },
  refetchInterval: 3000, // ← THÊM DÒNG NÀY
  refetchOnWindowFocus: true, // ← THÊM DÒNG NÀY
  refetchOnMount: true, // ← THÊM DÒNG NÀY
  staleTime: 0 // ← THÊM DÒNG NÀY
});

  const bookings = bookingsData || [];

  // Flatten tickets from all bookings
  const allTickets = bookings.flatMap(booking =>
    (booking.tickets || []).map(ticket => ({
      ...ticket,
      booking: {
        MaDon: booking.MaDon,
        MaBooking: booking.MaBooking,
        NgayDat: booking.NgayDat,
        TongTien: booking.TongTien,
        TrangThaiTT: booking.TrangThaiTT,
        paymentMethod: booking.paymentMethod
      }
    }))
  );

  // Mutation cập nhật vé
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, data }) => {
      return await api.put(`/bookings/ticket/${ticketId}`, data);
    },
    onSuccess: () => {
      message.success('Cập nhật thông tin vé thành công!');
      queryClient.invalidateQueries(['my-bookings']);
      setIsUpdateModalVisible(false);
      setTicketToUpdate(null);
      form.resetFields();
      if (selectedTicket && ticketToUpdate && selectedTicket.MaVe === ticketToUpdate.MaVe) {
        setIsDrawerVisible(false);
      }
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Cập nhật thất bại!');
    }
  });

  // Mutation hủy đơn
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      return await api.delete(`/bookings/${bookingId}`);
    },
    onSuccess: (response) => {
      message.success(response?.data?.message || 'Yêu cầu hủy vé đã được gửi!');
      queryClient.invalidateQueries(['my-bookings']);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Hủy vé thất bại!');
    }
  });

  const handleViewDetail = (ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerVisible(true);
  };

  const handleReview = (ticket) => {
    setSelectedTripForReview({
      tripId: ticket.MaChuyen,
      DiemDi: ticket.trip?.route?.diemDi?.TenDiaDiem,
      DiemDen: ticket.trip?.route?.diemDen?.TenDiaDiem,
      ThoiGianKhoiHanh: dayjs(ticket.trip?.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')
    });
    setIsReviewModalVisible(true);
  };

  const handleUpdateTicket = (ticket) => {
    const departureTime = dayjs(ticket.trip?.ThoiGianKhoiHanh);
    const now = dayjs();
    const hoursUntilDeparture = departureTime.diff(now, 'hour');

    if (hoursUntilDeparture < 24) {
      message.warning('Chỉ có thể cập nhật thông tin trước 24 giờ khởi hành!');
      return;
    }

    if (ticket.TrangThaiVe !== 1) {
      message.warning('Chỉ có thể cập nhật vé đã được duyệt!');
      return;
    }

    if (ticket.booking?.TrangThaiTT !== 1) {
      message.warning('Chỉ có thể cập nhật vé đã thanh toán!');
      return;
    }

    setTicketToUpdate(ticket);
    form.setFieldsValue({
      TenHanhKhach: ticket.TenHanhKhach,
      SDT: ticket.SDT,
      DiemDonChiTiet: ticket.DiemDonChiTiet,
      DiemTraChiTiet: ticket.DiemTraChiTiet
    });
    setIsUpdateModalVisible(true);
  };

  const handleSubmitUpdate = () => {
    form.validateFields().then(values => {
      updateTicketMutation.mutate({
        ticketId: ticketToUpdate.MaVe,
        data: values
      });
    });
  };

const handleCancelBooking = (booking, hoursUntilDeparture) => {
  // Kiểm tra thời gian
  if (hoursUntilDeparture < 24) {
    message.warning('Không thể hủy vé trong vòng 24 giờ trước giờ khởi hành!');
    return;
  }

  setBookingToCancel(booking);
  setIsCancelModalVisible(true);
};

const handleConfirmCancel = () => {
  if (bookingToCancel) {
    cancelBookingMutation.mutate(bookingToCancel.MaDon);
    setIsCancelModalVisible(false);
    setBookingToCancel(null);
  }
};

  const renderTicketStatus = (status) => {
    const statusMap = {
      0: { text: 'Chờ duyệt', color: 'warning' },
      1: { text: 'Đã duyệt', color: 'success' },
      2: { text: 'Đã hủy', color: 'error' }
    };
    const s = statusMap[status] || statusMap[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const renderPaymentStatus = (status) => {
    const statusMap = {
      0: { text: 'Chưa thanh toán', color: 'default' },
      1: { text: 'Đã thanh toán', color: 'success' },
      2: { text: 'Chờ duyệt', color: 'warning' },
      3: { text: 'Chờ duyệt hủy', color: 'orange' },
      6: { text: 'Đã hủy', color: 'error' }
    };
    const s = statusMap[status] || statusMap[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    {
      title: 'Mã vé',
      dataIndex: 'MaVe',
      key: 'MaVe',
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Chuyến xe',
      key: 'trip',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.trip?.route?.diemDi?.TenDiaDiem} → {record.trip?.route?.diemDen?.TenDiaDiem}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {dayjs(record.trip?.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Ghế',
      dataIndex: 'MaGhe',
      key: 'MaGhe',
      align: 'center',
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: 'Hành khách',
      key: 'passenger',
      render: (_, record) => (
        <div>
          <div>{record.TenHanhKhach}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.SDT}</div>
        </div>
      )
    },
    {
      title: 'Giá vé',
      dataIndex: 'GiaVe',
      key: 'GiaVe',
      render: (value) => `${value?.toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Trạng thái vé',
      dataIndex: 'TrangThaiVe',
      key: 'TrangThaiVe',
      render: renderTicketStatus
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      render: (_, record) => renderPaymentStatus(record.booking?.TrangThaiTT)
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 220,
      render: (_, record) => {
        const isPastTrip = dayjs(record.trip?.ThoiGianKhoiHanh).isBefore(dayjs());
        const isApproved = record.TrangThaiVe === 1;
        const isPaid = record.booking?.TrangThaiTT === 1;
        const isPending = record.booking?.TrangThaiTT === 2;
        const hoursUntilDeparture = dayjs(record.trip?.ThoiGianKhoiHanh).diff(dayjs(), 'hour');
        
        // Check điều kiện
        const canCancel = (isPaid || isPending) && !isPastTrip && hoursUntilDeparture >= 24;
        const canUpdate = !isPastTrip && isApproved && isPaid && hoursUntilDeparture >= 24;
        
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space size="small">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewDetail(record)}
              >
                Chi tiết
              </Button>
              
              {canUpdate && (
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleUpdateTicket(record)}
                >
                  Cập nhật
                </Button>
              )}
            </Space>

            <Space size="small" style={{ width: '100%' }}>
              {canCancel && (
                <Button
                  danger
                  size="small"
                  onClick={() => handleCancelBooking(record.booking, hoursUntilDeparture)}
                  loading={cancelBookingMutation.isPending}
                  block
                >
                  Hủy vé
                </Button>
              )}
              
              {isPastTrip && isApproved && (
                <Button
                  icon={<StarOutlined />}
                  size="small"
                  onClick={() => handleReview(record)}
                  style={{ color: '#faad14', borderColor: '#faad14' }}
                  block
                >
                  Đánh giá
                </Button>
              )}
            </Space>
          </Space>
        );
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <Card title="🎫 Vé của tôi">
          <Table
            columns={columns}
            dataSource={allTickets}
            rowKey="MaVe"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} vé`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Content>
      <Footer />

      {/* Drawer Chi tiết */}
      <Drawer
        title="Chi tiết vé"
        open={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        width={600}
      >
        {selectedTicket && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã vé">
                <Tag color="blue">#{selectedTicket.MaVe}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mã đơn">
                <Tag color="green">{selectedTicket.booking?.MaBooking}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tuyến đường">
                <strong>
                  {selectedTicket.trip?.route?.diemDi?.TenDiaDiem} → {selectedTicket.trip?.route?.diemDen?.TenDiaDiem}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian khởi hành">
                {dayjs(selectedTicket.trip?.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Dự kiến đến">
                {dayjs(selectedTicket.trip?.ThoiGianDuKienDen).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số xe">
                {selectedTicket.trip?.bus?.BienSoXe}
              </Descriptions.Item>
              <Descriptions.Item label="Loại xe">
                {selectedTicket.trip?.bus?.LoaiXe}
              </Descriptions.Item>
              <Descriptions.Item label="Số ghế">
                <Tag color="purple">{selectedTicket.MaGhe}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hành khách">
                {selectedTicket.TenHanhKhach}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedTicket.SDT}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm đón">
                {selectedTicket.DiemDonChiTiet || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm trả">
                {selectedTicket.DiemTraChiTiet || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá vé">
                <strong style={{ color: '#52c41a', fontSize: 16 }}>
                  {selectedTicket.GiaVe?.toLocaleString('vi-VN')} đ
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái vé">
                {renderTicketStatus(selectedTicket.TrangThaiVe)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                {renderPaymentStatus(selectedTicket.booking?.TrangThaiTT)}
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                {selectedTicket.booking?.paymentMethod?.TenPTTT}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(selectedTicket.booking?.NgayDat).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* Modal cập nhật thông tin */}
      <Modal
        title={<><EditOutlined /> Cập nhật thông tin vé</>}
        open={isUpdateModalVisible}
        onCancel={() => {
          setIsUpdateModalVisible(false);
          setTicketToUpdate(null);
          form.resetFields();
        }}
        onOk={handleSubmitUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={updateTicketMutation.isPending}
        width={600}
        mask={false}
        maskClosable={false}
      >
        {ticketToUpdate && (
          <div>
            <div style={{ 
              background: '#f0f2f5', 
              padding: 15, 
              borderRadius: 8,
              marginBottom: 20 
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Chuyến:</strong> {ticketToUpdate.trip?.route?.diemDi?.TenDiaDiem} → {ticketToUpdate.trip?.route?.diemDen?.TenDiaDiem}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Khởi hành:</strong> {dayjs(ticketToUpdate.trip?.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
              </div>
              <div>
                <strong>Ghế:</strong> <Tag color="purple">{ticketToUpdate.MaGhe}</Tag>
              </div>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="TenHanhKhach"
                label="Tên hành khách"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên!' },
                  { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' },
                  { max: 100, message: 'Tên không được quá 100 ký tự!' }
                ]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                name="SDT"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
                ]}
              >
                <Input placeholder="0123456789" maxLength={10} />
              </Form.Item>

              <Form.Item
                name="DiemDonChiTiet"
                label="Điểm đón chi tiết"
                rules={[
                  { max: 200, message: 'Không được quá 200 ký tự!' }
                ]}
              >
                <Input.TextArea 
                  rows={2}
                  placeholder="Ví dụ: 123 Lê Lợi, Quận Hải Châu"
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="DiemTraChiTiet"
                label="Điểm trả chi tiết"
                rules={[
                  { max: 200, message: 'Không được quá 200 ký tự!' }
                ]}
              >
                <Input.TextArea 
                  rows={2}
                  placeholder="Ví dụ: Bến xe Phía Nam"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>

            <div style={{ 
              background: '#fff7e6', 
              border: '1px solid #ffd666',
              padding: 12, 
              borderRadius: 8,
              fontSize: 13
            }}>
              ⚠️ <strong>Lưu ý:</strong> Bạn chỉ có thể cập nhật thông tin trước 24 giờ khởi hành.
            </div>
          </div>
        )}
      </Modal>
{/* Modal hủy vé */}
<Modal
  title="⚠️ Xác nhận hủy đơn vé"
  open={isCancelModalVisible}
  onCancel={() => {
    setIsCancelModalVisible(false);
    setBookingToCancel(null);
  }}
  onOk={handleConfirmCancel}
  okText="Xác nhận hủy"
  cancelText="Không hủy"
  okButtonProps={{ 
    danger: true,
    loading: cancelBookingMutation.isPending 
  }}
  width={500}
  mask={false}
  maskClosable={false}
>
  {bookingToCancel && (
    <div>
      <p style={{ fontSize: 15, marginBottom: 16 }}>
        <strong>Bạn có chắc muốn hủy đơn vé này?</strong>
      </p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: 12, 
        borderRadius: 8,
        marginBottom: 16 
      }}>
        <div><strong>Mã đơn:</strong> {bookingToCancel.MaBooking}</div>
      </div>

      {bookingToCancel.TrangThaiTT === 1 && (
        <div style={{ 
          background: '#fff7e6', 
          border: '1px solid #ffd666',
          padding: 12, 
          borderRadius: 8
        }}>
          ⚠️ <strong>Lưu ý:</strong> Đơn đã thanh toán. Sau khi nhân viên duyệt, số tiền sẽ được hoàn lại vào tài khoản của bạn.
        </div>
      )}
    </div>
  )}
</Modal>
      {/* Modal đánh giá */}
      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => {
          setIsReviewModalVisible(false);
          setSelectedTripForReview(null);
        }}
        tripId={selectedTripForReview?.tripId}
        tripInfo={selectedTripForReview}
        mask={false}
        maskClosable={false}
      />
    </Layout>
  );
};

export default MyBookings;