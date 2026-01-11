import { useState, useMemo } from 'react';
import { Layout, Card, Table, Tag, Button, Drawer, Descriptions, Space, Select, Input, message, Modal } from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SearchOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import api from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Option } = Select;

const EmployeeDashboard = () => {
  const queryClient = useQueryClient();
  
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelTicketModalVisible, setIsCancelTicketModalVisible] = useState(false);
  const [isApproveCancelModalVisible, setIsApproveCancelModalVisible] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [pendingTicketId, setPendingTicketId] = useState(null);
  const [pendingCancelBookingId, setPendingCancelBookingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  // Fetch bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['employee-bookings', filters],
    queryFn: async () => {
      const response = await api.get('/employee/bookings', { params: filters });
      return response.data;
    },
    staleTime: 0,
    cacheTime: 0
  });

  // Mutation duyệt thanh toán
  const approvePaymentMutation = useMutation({
    mutationFn: async (bookingId) => {
      const response = await api.put(`/employee/bookings/${bookingId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Duyệt thanh toán thành công!');
      queryClient.invalidateQueries(['employee-bookings']);
      setIsDrawerVisible(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Duyệt thanh toán thất bại!');
    }
  });

  // Mutation hủy đơn hàng
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const response = await api.put(`/employee/bookings/${bookingId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Đã hủy đơn hàng thành công!');
      queryClient.invalidateQueries(['employee-bookings']);
      setIsDrawerVisible(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Hủy đơn thất bại!');
    }
  });

  // ===== MUTATION DUYỆT HỦY VỚI AUTO REFUND SAU 10S =====
  const approveCancellationMutation = useMutation({
    mutationFn: async (bookingId) => {
      const response = await api.put(`/bookings/${bookingId}/approve-cancel`);
      return response.data;
    },
    onSuccess: (data, bookingId) => {
      message.success('Đã duyệt hủy vé thành công!');
      
      // Hiện thông báo đang xử lý hoàn tiền
      const loadingMessage = message.loading('⏳ Đang xử lý hoàn tiền... (10 giây)', 0);
      
      // Đếm ngược
      let countdown = 10;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          message.loading(`⏳ Đang xử lý hoàn tiền... (${countdown} giây)`, 0);
        }
      }, 1000);
      
      // Sau 10s: Gọi API hoàn tiền
      setTimeout(async () => {
        clearInterval(countdownInterval);
        loadingMessage();
        
        try {
          // Gọi API hoàn tiền (giả lập - thực tế là backend tự động)
          await api.put(`/bookings/${bookingId}/complete-refund`);
          
          message.success('✅ Đã hoàn tiền thành công!', 3);
          queryClient.invalidateQueries(['employee-bookings']);
        } catch (error) {
          message.error('❌ Lỗi khi hoàn tiền: ' + (error?.response?.data?.message || 'Vui lòng thử lại'));
        }
      }, 10000);
      
      queryClient.invalidateQueries(['employee-bookings']);
      setIsDrawerVisible(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Duyệt hủy thất bại!');
    }
  });

  // Duyệt hủy
  const handleApproveCancellation = (bookingId) => {
    setPendingCancelBookingId(bookingId);
    setIsApproveCancelModalVisible(true);
  };

  const confirmApproveCancellation = () => {
    approveCancellationMutation.mutate(pendingCancelBookingId);
    setIsApproveCancelModalVisible(false);
    setPendingCancelBookingId(null);
  };

  // Mutation hủy vé đơn lẻ
  // Mutation hủy vé đơn lẻ
const cancelTicketMutation = useMutation({
  mutationFn: async (ticketId) => {
    const response = await api.put(`/employee/tickets/${ticketId}/cancel`);
    console.log('🎫 Cancel ticket response:', response);
    return { ticketId, response };
  },
  onSuccess: ({ ticketId, response }) => {
    message.success('Đã hủy vé thành công!');
    
    // Cập nhật local state
    if (selectedBooking && selectedBooking.tickets) {
      // Đánh dấu vé đã hủy
      const updatedTickets = selectedBooking.tickets.map(ticket => 
        ticket.MaVe === ticketId 
          ? { ...ticket, TrangThaiVe: 2 }
          : ticket
      );
      
      // Cập nhật tổng tiền nếu có trong response
      const newTotal = response?.data?.newTotal || response?.newTotal || selectedBooking.TongTien;
      
      setSelectedBooking({
        ...selectedBooking,
        tickets: updatedTickets,
        TongTien: newTotal
      });
      
      console.log('✅ Booking updated locally');
    }
    
    // Refresh list
    queryClient.invalidateQueries(['employee-bookings']);
  },
  onError: (error) => {
    console.error('❌ Cancel ticket error:', error);
    message.error(error?.message || 'Hủy vé thất bại!');
  }
});

  const bookings = useMemo(() => {
    return bookingsData || [];
  }, [bookingsData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const renderPaymentStatus = (status) => {
  const statusMap = {
    0: { text: 'Chưa thanh toán', color: 'default' },
    1: { text: 'Đã duyệt', color: 'success' },
    2: { text: 'Chờ duyệt', color: 'warning' },
    3: { text: 'Chờ duyệt hủy', color: 'orange' },
    4: { text: 'Chờ hoàn tiền', color: 'purple' },
    5: { text: 'Đã hoàn tiền', color: 'error' },
    6: { text: 'Đã hủy', color: 'default' }
  };
  const s = statusMap[status] || statusMap[0];
  return <Tag color={s.color}>{s.text}</Tag>;
};

  const renderTicketStatus = (status) => {
  const statusMap = {
    0: { text: 'Chưa sử dụng', color: 'default' },
    1: { text: 'Đã thanh toán', color: 'success' },
    2: { text: 'Đã hủy', color: 'error' } // ← THÊM TRẠNG THÁI 2
  };
  
  const s = statusMap[status] || statusMap[0];
  return <Tag color={s.color}>{s.text}</Tag>;
};
  const showBookingDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
    setSelectedBooking(null);
  };

  const handleApprovePayment = (bookingId) => {
    setPendingBookingId(bookingId);
    setIsApproveModalVisible(true);
  };

  const confirmApprove = () => {
    approvePaymentMutation.mutate(pendingBookingId);
    setIsApproveModalVisible(false);
    setPendingBookingId(null);
  };

  const handleCancelBooking = (bookingId) => {
    setPendingBookingId(bookingId);
    setIsCancelModalVisible(true);
  };

  const confirmCancel = () => {
    cancelBookingMutation.mutate(pendingBookingId);
    setIsCancelModalVisible(false);
    setPendingBookingId(null);
  };

  const handleCancelTicket = (ticketId) => {
    setPendingTicketId(ticketId);
    setIsCancelTicketModalVisible(true);
  };

  const confirmCancelTicket = () => {
    cancelTicketMutation.mutate(pendingTicketId);
    setIsCancelTicketModalVisible(false);
    setPendingTicketId(null);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.TrangThaiTT !== parseInt(filters.status)) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchBooking = booking.MaBooking?.toLowerCase().includes(searchLower);
      const matchUser = booking.user?.HoTen?.toLowerCase().includes(searchLower);
      
      if (!matchBooking && !matchUser) return false;
    }
    
    return true;
  });

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'MaBooking',
      key: 'MaBooking',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div><strong>{record.user?.HoTen}</strong></div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.user?.SDT}</div>
        </div>
      )
    },
    {
      title: 'Số vé',
      key: 'tickets',
      align: 'center',
      render: (_, record) => (
        <Tag color="purple">{record.tickets?.length || 0} vé</Tag>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TongTien',
      key: 'TongTien',
      align: 'right',
      render: (value) => (
        <strong style={{ color: '#52c41a' }}>{formatCurrency(value)}</strong>
      )
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      render: (_, record) => (
        <div>
          {renderPaymentStatus(record.TrangThaiTT)}
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.paymentMethod?.TenPTTT}
          </div>
        </div>
      )
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'NgayDat',
      key: 'NgayDat',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
  title: 'Hành động',
  key: 'action',
  width: 280,
  render: (_, record) => (
    <Space>
      <Button
        type="primary"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => showBookingDetail(record)}
      >
        Xem
      </Button>
      
      {/* ===== CHỈ HIỆN KHI TRẠNG THÁI 2 ===== */}
      {record.TrangThaiTT === 2 && (
        <>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => handleApprovePayment(record.MaDon)}
            loading={approvePaymentMutation.isPending}
          >
            Duyệt
          </Button>
          
          <Button
            danger
            icon={<CloseCircleOutlined />}
            size="small"
            onClick={() => handleCancelBooking(record.MaDon)}
            loading={cancelBookingMutation.isPending}
          >
            Hủy
          </Button>
        </>
      )}

      {/* Duyệt hủy cho trạng thái 3 */}
      {record.TrangThaiTT === 3 && (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          size="small"
          style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
          onClick={() => handleApproveCancellation(record.MaDon)}
          loading={approveCancellationMutation.isPending}
        >
          Duyệt hủy
        </Button>
      )}
    </Space>
  )
}
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <Card
          title={
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              💼 Quản lý Đơn vé
            </div>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['employee-bookings'])}
            >
              Làm mới
            </Button>
          }
        >
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <Input
              placeholder="Tìm theo mã đơn, tên khách..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />

            <Select
              placeholder="Trạng thái thanh toán"
              style={{ width: 200 }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="all">Tất cả</Option>
              <Option value="0">Chưa thanh toán</Option>
              <Option value="1">Đã thanh toán</Option>
              <Option value="2">Chờ duyệt</Option>
              <Option value="3">Chờ duyệt hủy</Option>
              <Option value="4">Chờ hoàn tiền</Option>
              <Option value="5">Đã hoàn tiền</Option>
              <Option value="6">Đã hủy</Option>
            </Select>
          </div>

          <Table
            columns={columns}
            dataSource={filteredBookings}
            rowKey="MaDon"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} đơn`
            }}
          />
        </Card>
      </Content>
      <Footer />

      {/* Drawer Chi tiết */}
      <Drawer
        title="📋 Chi tiết đơn vé"
        open={isDrawerVisible}
        onClose={handleDrawerClose}
        width={720}
        extra={
          selectedBooking?.TrangThaiTT === 2 && (
            <Space>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancelBooking(selectedBooking.MaDon)}
                loading={cancelBookingMutation.isPending}
              >
                Hủy đơn
              </Button>
              
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprovePayment(selectedBooking.MaDon)}
                loading={approvePaymentMutation.isPending}
              >
                Duyệt thanh toán
              </Button>
            </Space>
          )
        }
      >
        {selectedBooking && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã đơn" span={2}>
                <Tag color="blue">{selectedBooking.MaBooking}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Khách hàng">
                {selectedBooking.user?.HoTen}
              </Descriptions.Item>
              
              <Descriptions.Item label="Số điện thoại">
                {selectedBooking.user?.SDT}
              </Descriptions.Item>
              
              <Descriptions.Item label="Email" span={2}>
                {selectedBooking.user?.Email}
              </Descriptions.Item>
              
              <Descriptions.Item label="Tổng tiền">
                <strong style={{ color: '#52c41a' }}>
                  {formatCurrency(selectedBooking.TongTien)}
                </strong>
              </Descriptions.Item>
              
              <Descriptions.Item label="Thanh toán">
                {renderPaymentStatus(selectedBooking.TrangThaiTT)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Phương thức" span={2}>
                {selectedBooking.paymentMethod?.TenPTTT}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngày đặt">
                {dayjs(selectedBooking.NgayDat).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngày thanh toán">
                {selectedBooking.NgayThanhToan 
                  ? dayjs(selectedBooking.NgayThanhToan).format('DD/MM/YYYY HH:mm')
                  : 'Chưa thanh toán'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <h4>🎫 Danh sách vé ({selectedBooking.tickets?.length || 0})</h4>
              <Table
                dataSource={selectedBooking.tickets || []}
                rowKey="MaVe"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Mã vé',
                    dataIndex: 'MaVe',
                    key: 'MaVe',
                    render: (text) => <Tag>#{text}</Tag>
                  },
                  {
                    title: 'Chuyến xe',
                    key: 'trip',
                    render: (_, record) => (
                      <div>
                        <div>
                          <strong>{record.trip?.route?.diemDi?.TenDiaDiem}</strong>
                          {' → '}
                          <strong>{record.trip?.route?.diemDen?.TenDiaDiem}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {record.trip?.ThoiGianKhoiHanh 
                            ? dayjs(record.trip.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')
                            : 'N/A'}
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Ghế',
                    dataIndex: 'MaGhe',
                    key: 'MaGhe',
                    align: 'center',
                    render: (text) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: 'Hành khách',
                    key: 'passenger',
                    render: (_, record) => (
                      <div>
                        <div>{record.TenHanhKhach}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{record.SDT}</div>
                      </div>
                    )
                  },
                  {
                    title: 'Điểm đón',
                    dataIndex: 'DiemDonChiTiet',
                    key: 'DiemDonChiTiet',
                    render: (text) => text || '—'
                  },
                  {
                    title: 'Điểm trả',
                    dataIndex: 'DiemTraChiTiet',
                    key: 'DiemTraChiTiet',
                    render: (text) => text || '—'
                  },
                  {
                    title: 'Giá vé',
                    dataIndex: 'GiaVe',
                    key: 'GiaVe',
                    align: 'right',
                    render: (value) => formatCurrency(value)
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'TrangThaiVe',
                    key: 'TrangThaiVe',
                    render: (status) => renderTicketStatus(status)
                  },
                  {
                    title: 'Hành động',
                    key: 'action',
                    align: 'center',
                    render: (_, record) => (
                      selectedBooking?.TrangThaiTT === 2 && record.TrangThaiVe === 0 && (
                        <Button
                          danger
                          size="small"
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleCancelTicket(record.MaVe)}
                          loading={cancelTicketMutation.isPending}
                        >
                          Hủy vé
                        </Button>
                      )
                    )
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="Xác nhận duyệt thanh toán"
        open={isApproveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setIsApproveModalVisible(false);
          setPendingBookingId(null);
        }}
        okText="Duyệt"
        cancelText="Hủy"
        okButtonProps={{ loading: approvePaymentMutation.isPending }}
        mask={false}
        maskClosable={false}
      >
        <p>Bạn đã kiểm tra và xác nhận khách hàng đã thanh toán đúng số tiền?</p>
      </Modal>

      <Modal
        title="Xác nhận hủy đơn hàng"
        open={isCancelModalVisible}
        onOk={confirmCancel}
        onCancel={() => {
          setIsCancelModalVisible(false);
          setPendingBookingId(null);
        }}
        okText="Hủy đơn"
        cancelText="Không hủy"
        okButtonProps={{ danger: true, loading: cancelBookingMutation.isPending }}
        mask={false}
        maskClosable={false}
      >
        <p><strong>Bạn có chắc muốn hủy đơn hàng này?</strong></p>
        <p>Sau khi hủy:</p>
        <ul>
          <li>Tất cả vé trong đơn sẽ bị hủy</li>
          <li>Ghế sẽ được giải phóng</li>
          <li>Khách hàng có thể được hoàn tiền</li>
        </ul>
      </Modal>

      <Modal
        title="Xác nhận hủy vé"
        open={isCancelTicketModalVisible}
        onOk={confirmCancelTicket}
        onCancel={() => {
          setIsCancelTicketModalVisible(false);
          setPendingTicketId(null);
        }}
        okText="Hủy vé"
        cancelText="Không hủy"
        okButtonProps={{ danger: true, loading: cancelTicketMutation.isPending }}
        mask={false}
        maskClosable={false}
      >
        <p><strong>Bạn có chắc muốn hủy vé này?</strong></p>
        <p>Sau khi hủy:</p>
        <ul>
          <li>Vé sẽ không thể sử dụng</li>
          <li>Ghế sẽ được giải phóng</li>
          <li>Tiền vé sẽ được trừ khỏi tổng đơn hàng</li>
        </ul>
      </Modal>

      <Modal
        title="Xác nhận duyệt hủy vé"
        open={isApproveCancelModalVisible}
        onOk={confirmApproveCancellation}
        onCancel={() => {
          setIsApproveCancelModalVisible(false);
          setPendingCancelBookingId(null);
        }}
        okText="Duyệt hủy"
        cancelText="Quay lại"
        okButtonProps={{ loading: approveCancellationMutation.isPending }}
        mask={false}
        maskClosable={false}
      >
        <p><strong>Bạn có chắc muốn duyệt yêu cầu hủy vé này?</strong></p>
        <p>Sau khi duyệt:</p>
        <ul>
          <li>✅ Yêu cầu hoàn tiền sẽ được tạo</li>
          <li>✅ Trạng thái chuyển sang "Chờ hoàn tiền"</li>
          <li>⏳ Sau 10 giây sẽ tự động hoàn tiền</li>
          <li>✅ Tất cả vé trong đơn sẽ bị hủy</li>
          <li>✅ Ghế sẽ được giải phóng</li>
        </ul>
      </Modal>
    </Layout>
  );
};

export default EmployeeDashboard;