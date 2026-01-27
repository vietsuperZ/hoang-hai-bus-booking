import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Tag, Space, 
  Descriptions, message, Badge, Select, DatePicker, Input, Popconfirm, List
} from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, SearchOutlined, FilterOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import adminService from '../../services/adminService.js';
import api from '../../services/api';

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

  // Mutation hủy đơn
  // Mutation hủy đơn
const cancelBookingMutation = useMutation({
  mutationFn: async (bookingId) => {
    // Không cần return, chỉ cần call API
    await api.put(`/employee/bookings/${bookingId}/cancel`);
  },
  onSuccess: () => {
    message.success('Hủy đơn thành công!');
    queryClient.invalidateQueries(['admin-bookings']);
    setIsDetailModalVisible(false);
  },
  onError: (error) => {
    message.error(error?.message || 'Hủy đơn thất bại!');
  }
});

// Mutation hủy vé
const cancelTicketMutation = useMutation({
  mutationFn: async (ticketId) => {
    await api.put(`/employee/tickets/${ticketId}/cancel`);
  },
  onSuccess: () => {
    message.success('Hủy vé thành công!');
    queryClient.invalidateQueries(['admin-bookings']);
    if (selectedBooking) {
      handleViewDetail({ MaDon: selectedBooking.MaDon });
    }
  },
  onError: (error) => {
    message.error(error?.message || 'Hủy vé thất bại!');
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

  // Hủy đơn
  const handleCancelBooking = (bookingId) => {
    cancelBookingMutation.mutate(bookingId);
  };

  // Hủy vé
  const handleCancelTicket = (ticketId) => {
    cancelTicketMutation.mutate(ticketId);
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
      3: 'Đã hoàn tiền',
      6: 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
  };

  // Render trạng thái thanh toán
  const renderPaymentStatus = (status) => {
    const statusConfig = {
      'Chưa thanh toán': { color: 'default', icon: '⏳' },
      'Chờ duyệt': { color: 'processing', icon: '🔄' },
      'Đã thanh toán': { color: 'success', icon: '✅' },
      'Đã hoàn tiền': { color: 'warning', icon: '💰' },
      'Đã hủy': { color: 'error', icon: '❌' }
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
  width: 250,
  render: (_, record) => {
    // THÊM LOG
    console.log('==================');
    console.log('Record:', record);
    console.log('TrangThaiTT:', record.TrangThaiTT);
    console.log('Type of TrangThaiTT:', typeof record.TrangThaiTT);
    console.log('Check !== 6:', record.TrangThaiTT !== 6);
    console.log('Check === 6:', record.TrangThaiTT === 6);
    console.log('==================');
    
    return (
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

        {/* TEST: LUÔN HIỆN */}
        <span style={{color: 'red', marginLeft: 10}}>
          TEST: TT={record.TrangThaiTT}
        </span>

        {record.TrangThaiTT !== 6 && (
          <Popconfirm
            title="Test hủy đơn"
            onConfirm={() => handleCancelBooking(record.MaDon)}
            okText="Hủy đơn"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<CloseCircleOutlined />}
              size="small"
              loading={cancelBookingMutation.isPending}
            >
              Hủy
            </Button>
          </Popconfirm>
        )}
      </Space>
    );
  }
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
            <Option value="6">Đã hủy</Option>
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
        width={900}
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
              
              <List
                dataSource={selectedBooking.tickets || []}
                renderItem={(ticket) => (
                  <List.Item
                    actions={[
                      ticket.TrangThaiVe !== 2 ? (
                        <Popconfirm
                          title="Xác nhận hủy vé này?"
                          onConfirm={() => handleCancelTicket(ticket.MaVe)}
                          okText="Hủy vé"
                          cancelText="Không"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={cancelTicketMutation.isPending}
                          >
                            Hủy vé
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Tag color="error">Đã hủy</Tag>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">Vé #{ticket.MaVe}</Tag>
                          <Tag color="orange">Ghế {ticket.MaGhe}</Tag>
                          {ticket.TrangThaiVe === 1 && <Tag color="success">Đã duyệt</Tag>}
                          {ticket.TrangThaiVe === 0 && <Tag color="warning">Chờ duyệt</Tag>}
                          {ticket.TrangThaiVe === 2 && <Tag color="error">Đã hủy</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <div>{ticket.trip?.route?.diemDi?.TenDiaDiem} → {ticket.trip?.route?.diemDen?.TenDiaDiem}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Khởi hành: {formatDateTime(ticket.trip?.ThoiGianKhoiHanh)} | Giá: {formatMoney(ticket.GiaVe)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            {/* Footer modal - Nút duyệt và hủy cho TẤT CẢ trừ đã hủy */}
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCloseModal}>
                  Đóng
                </Button>

                {/* Nút Duyệt - Chỉ cho chờ duyệt */}
                {selectedBooking.TrangThaiTT === 2 && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(selectedBooking.MaDon)}
                    loading={approveMutation.isPending}
                    style={{ background: '#52c41a' }}
                  >
                    Duyệt thanh toán
                  </Button>
                )}

                {/* Nút Hủy đơn - Cho TẤT CẢ trừ đã hủy */}
                {selectedBooking.TrangThaiTT !== 6 && (
                  <Popconfirm
                    title={
                      selectedBooking.TrangThaiTT === 1 
                        ? "Đơn đã thanh toán! Hủy sẽ hoàn tiền. Xác nhận?" 
                        : "Xác nhận hủy đơn này?"
                    }
                    onConfirm={() => handleCancelBooking(selectedBooking.MaDon)}
                    okText="Hủy đơn"
                    cancelText="Không"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={cancelBookingMutation.isPending}
                    >
                      Hủy đơn
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;