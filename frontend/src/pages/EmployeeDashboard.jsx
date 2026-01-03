import { useState, useMemo } from 'react';
import { Layout, Card, Table, Tag, Button, Drawer, Descriptions, Space, Select, Input, message } from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SearchOutlined, ReloadOutlined, DollarOutlined 
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

  const bookings = useMemo(() => {
    return bookingsData || [];
  }, [bookingsData]);

  // Format tiền
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  // Render trạng thái thanh toán
  const renderPaymentStatus = (status) => {
    const statusMap = {
      0: { text: 'Chưa thanh toán', color: 'default' },
      1: { text: 'Đã thanh toán', color: 'success' },
      2: { text: 'Chờ duyệt', color: 'warning' },
      3: { text: 'Ã hoàn tiền', color: 'error' }
    };
    const s = statusMap[status] || statusMap[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  // Render trạng thái vé
  const renderTicketStatus = (status) => {
    return status === 0 ? (
      <Tag color="blue">Chưa sử dụng</Tag>
    ) : (
      <Tag color="green">Đã sử dụng</Tag>
    );
  };

  // Xem chi tiết - DÙNG DATA CÓ SẴN (giống MyBookings)
  const showBookingDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerVisible(false);
    setSelectedBooking(null);
  };

  // Duyệt thanh toán
  const handleApprovePayment = (bookingId) => {
    approvePaymentMutation.mutate(bookingId);
  };

  // Filter bookings
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

  // Cột bảng
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
      width: 200,
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
          
          {record.TrangThaiTT === 2 && (
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
          {/* Filters */}
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
              <Option value="3">Đã hoàn tiền</Option>
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
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprovePayment(selectedBooking.MaDon)}
              loading={approvePaymentMutation.isPending}
            >
              Duyệt thanh toán
            </Button>
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

            {/* Danh sách vé */}
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
                        <div><strong>{record.trip?.route?.diemDi?.TenDiaDiem}</strong> → <strong>{record.trip?.route?.diemDen?.TenDiaDiem}</strong></div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
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
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </Layout>
  );
};

export default EmployeeDashboard;