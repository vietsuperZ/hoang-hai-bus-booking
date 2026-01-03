import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Tag, Space, 
  Descriptions, message, Badge, Select, DatePicker, Input
} from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import adminService from '../../services/adminService.js';

const { Option } = Select;
const { RangePicker } = DatePicker;

const BookingManagement = () => {
  const queryClient = useQueryClient();
  
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({
    paymentStatus: 'all',
    dateRange: null
  });

  // Fetch danh sách đơn vé
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => adminService.getAllBookings(filters)
  });

  // Mutation duyệt thanh toán
  const approveMutation = useMutation({
    mutationFn: adminService.approveBooking,
    onSuccess: () => {
      message.success('Đã duyệt thanh toán thành công!');
      queryClient.invalidateQueries(['admin-bookings']);
      setIsDetailModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Duyệt thanh toán thất bại!');
    }
  });

  const bookings = bookingsData?.data || [];

  // Xem chi tiết đơn vé
  const handleViewDetail = async (booking) => {
    try {
      const response = await adminService.getBookingById(booking.MaDon);
      setSelectedBooking(response.data);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết đơn vé!');
    }
  };

  // Duyệt thanh toán
  const handleApprove = (bookingId) => {
    approveMutation.mutate(bookingId);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsDetailModalVisible(false);
    setSelectedBooking(null);
  };

  // Format ngày giờ
  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  };

  // Format tiền
  const formatMoney = (amount) => {
    return amount?.toLocaleString('vi-VN') + ' VNĐ';
  };

  // Map trạng thái thanh toán từ số sang text
  const mapPaymentStatus = (status) => {
    const statusMap = {
      0: 'Chưa thanh toán',
      1: 'Đã thanh toán',
      2: 'Chờ duyệt',
      3: 'Đã hoàn tiền'
    };
    return statusMap[status] || 'Không xác định';
  };

  // Render trạng thái thanh toán
  const renderPaymentStatus = (status) => {
    const statusConfig = {
      'Chưa thanh toán': { color: 'default', icon: '⏳' },
      'Chờ duyệt': { color: 'processing', icon: '🔄' },
      'Đã thanh toán': { color: 'success', icon: '✅' },
      'Đã hoàn tiền': { color: 'warning', icon: '💰' }
    };
    
    const config = statusConfig[status] || { color: 'default', icon: '❓' };
    return (
      <Tag color={config.color}>
        {config.icon} {status}
      </Tag>
    );
  };

  // Cột bảng
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'MaDon',
      key: 'MaDon',
      width: 100,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div><strong>{record.user?.HoTen || '---'}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.user?.SDT || '---'}</div>
        </div>
      )
    },
    {
      title: 'Số vé',
      key: 'ticketCount',
      align: 'center',
      render: (_, record) => (
        <Badge count={record.tickets?.length || 0} showZero color="blue" />
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TongTien',
      key: 'TongTien',
      render: (amount) => (
        <Tag color="green" style={{ fontSize: '13px' }}>
          {formatMoney(amount)}
        </Tag>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'TrangThaiTT',
      key: 'TrangThaiTT',
      render: (status) => renderPaymentStatus(mapPaymentStatus(status))
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDateTime
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
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
          
          {record.TrangThaiTT === 2 && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="small"
              style={{ background: '#52c41a' }}
              onClick={() => handleApprove(record.MaDon)}
              loading={approveMutation.isPending}
            >
              Duyệt
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            📝 Quản lý Đơn vé
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-bookings'])}
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Select
            placeholder="Trạng thái thanh toán"
            style={{ width: 200 }}
            value={filters.paymentStatus}
            onChange={(value) => setFilters({ ...filters, paymentStatus: value })}
          >
            <Option value="all">Tất cả thanh toán</Option>
            <Option value="0">Chưa thanh toán</Option>
            <Option value="1">Đã thanh toán</Option>
            <Option value="2">Chờ duyệt</Option>
            <Option value="3">Đã hoàn tiền</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="MaDon"
          loading={bookingsLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} đơn`
          }}
        />
      </Card>

      {/* Modal Chi tiết */}
      <Modal
        title="📋 Chi tiết đơn đặt vé"
        open={isDetailModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        destroyOnClose
        mask={false}
        maskClosable={false}
      >
        {selectedBooking && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã đơn" span={2}>
                <Tag color="blue" style={{ fontSize: '14px' }}>#{selectedBooking.MaDon}</Tag>
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
              
              <Descriptions.Item label="Thanh toán" span={2}>
                {renderPaymentStatus(mapPaymentStatus(selectedBooking.TrangThaiTT))}
              </Descriptions.Item>
              
              <Descriptions.Item label="Phương thức">
                {selectedBooking.paymentMethod?.TenPTTT || '---'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Tổng tiền">
                <Tag color="green" style={{ fontSize: '14px' }}>
                  {formatMoney(selectedBooking.TongTien)}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngày đặt" span={2}>
                {formatDateTime(selectedBooking.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            {/* Danh sách vé */}
            <div style={{ marginTop: '24px' }}>
              <h3>🎫 Danh sách vé ({selectedBooking.tickets?.length || 0} vé)</h3>
              <Table
                dataSource={selectedBooking.tickets || []}
                rowKey="MaVe"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Mã vé',
                    dataIndex: 'MaVe',
                    render: (text) => <Tag>#{text}</Tag>
                  },
                  {
                    title: 'Chuyến xe',
                    key: 'trip',
                    render: (_, record) => (
                      <div>
                        <div>{record.trip?.route?.diemDi?.TenDiaDiem} → {record.trip?.route?.diemDen?.TenDiaDiem}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {formatDateTime(record.trip?.ThoiGianKhoiHanh)}
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Số ghế',
                    dataIndex: 'MaGhe',
                    align: 'center',
                    render: (seat) => <Tag color="blue">{seat || '---'}</Tag>
                  },
                  {
                    title: 'Giá vé',
                    dataIndex: 'GiaVe',
                    render: (price) => formatMoney(price)
                  }
                ]}
              />
            </div>

            {/* Nút duyệt */}
            {selectedBooking.TrangThaiTT === 2 && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleCloseModal}>
                    Đóng
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(selectedBooking.MaDon)}
                    loading={approveMutation.isPending}
                    style={{ background: '#52c41a' }}
                  >
                    Duyệt thanh toán
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;