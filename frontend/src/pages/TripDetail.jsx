import { useState } from 'react';
import { 
  Layout, Card, Descriptions, Button, Table, Tag, Space, Modal, 
  message, Popconfirm, List, Divider
} from 'antd';
import { 
  ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  PrinterOutlined, CarOutlined, EyeOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import api from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Lấy chi tiết chuyến
  const { data: tripData, isLoading } = useQuery({
    queryKey: ['trip-detail', id],
    queryFn: async () => {
      const response = await api.get(`/employee/trips/${id}`);
      return response.data;
    }
  });

  // Lấy thông tin in
  const { data: printData, isLoading: isPrintLoading } = useQuery({
    queryKey: ['trip-print', id],
    queryFn: async () => {
      const response = await api.get(`/employee/trips/${id}/print`);
      return response.data;
    },
    enabled: isPrintModalVisible
  });

  // Duyệt đơn
  const approveMutation = useMutation({
    mutationFn: async (bookingId) => {
      return await api.put(`/employee/bookings/${bookingId}/approve`);
    },
    onSuccess: () => {
      message.success('Duyệt đơn thành công!');
      queryClient.invalidateQueries(['trip-detail', id]);
      queryClient.invalidateQueries(['trip-print', id]);
    },
    onError: (error) => {
      message.error(error?.message || 'Duyệt đơn thất bại!');
    }
  });

  // Hủy đơn
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      return await api.put(`/employee/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      message.success('Hủy đơn thành công!');
      queryClient.invalidateQueries(['trip-detail', id]);
    },
    onError: (error) => {
      message.error(error?.message || 'Hủy đơn thất bại!');
    }
  });

  // Hủy vé đơn lẻ
  const cancelTicketMutation = useMutation({
    mutationFn: async (ticketId) => {
      return await api.put(`/employee/tickets/${ticketId}/cancel`);
    },
    onSuccess: () => {
      message.success('Hủy vé thành công!');
      queryClient.invalidateQueries(['trip-detail', id]);
      setIsDetailModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.message || 'Hủy vé thất bại!');
    }
  });

  const handleApprove = (bookingId) => {
    approveMutation.mutate(bookingId);
  };

  const handleCancelBooking = (bookingId) => {
    cancelBookingMutation.mutate(bookingId);
  };

  const handleCancelTicket = (ticketId) => {
    cancelTicketMutation.mutate(ticketId);
  };

  const handlePrint = () => {
    setIsPrintModalVisible(true);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'MaBooking',
      key: 'MaBooking',
      width: 120
    },
    {
      title: 'Người đặt',
      key: 'customer',
      render: (record) => (
        <Space direction="vertical" size={0}>
          <span><strong>{record.NguoiDat}</strong></span>
          <span style={{ fontSize: 12, color: '#666' }}>{record.SDT}</span>
        </Space>
      )
    },
    {
      title: 'Ghế',
      dataIndex: 'DanhSachGhe',
      key: 'DanhSachGhe',
      render: (ghe) => ghe?.join(', ')
    },
    {
      title: 'Số vé',
      dataIndex: 'SoVe',
      key: 'SoVe',
      width: 80
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TongTien',
      key: 'TongTien',
      render: (money) => `${money?.toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThaiTT',
      key: 'TrangThaiTT',
      width: 120,
      render: (status) => {
        const statusMap = {
          1: { text: 'Đã duyệt', color: 'success' },
          2: { text: 'Chờ duyệt', color: 'warning' },
          6: { text: 'Đã hủy', color: 'error' }
        };
        return <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || 'N/A'}</Tag>;
      }
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'NgayDat',
      key: 'NgayDat',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      render: (record) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          {record.TrangThaiTT === 2 && (
            <>
              <Popconfirm
                title="Xác nhận duyệt đơn này?"
                onConfirm={() => handleApprove(record.MaDon)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  loading={approveMutation.isPending}
                >
                  Duyệt
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Xác nhận hủy đơn này?"
                onConfirm={() => handleCancelBooking(record.MaDon)}
                okText="Hủy đơn"
                cancelText="Không"
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
            </>
          )}
        </Space>
      )
    }
  ];

  const passengerColumns = [
    { title: 'STT', key: 'index', render: (_, __, i) => i + 1, width: 60 },
    { title: 'Ghế', dataIndex: 'MaGhe', key: 'MaGhe', width: 80 },
    { title: 'Họ tên', dataIndex: 'TenHanhKhach', key: 'TenHanhKhach' },
    { title: 'SĐT', dataIndex: 'SDT', key: 'SDT' },
    { title: 'Điểm đón', dataIndex: 'DiemDonChiTiet', key: 'DiemDonChiTiet' },
    { title: 'Điểm trả', dataIndex: 'DiemTraChiTiet', key: 'DiemTraChiTiet' }
  ];

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <p>Đang tải...</p>
        </Content>
        <Footer />
      </Layout>
    );
  }

  if (!tripData) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <p>Không tìm thấy chuyến xe</p>
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
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employee/trips')}>
                Quay lại
              </Button>
              <Button
  type="primary"
  icon={<PrinterOutlined />}
  onClick={handlePrint}
>
  In danh sách khách
</Button>
            </Space>

            {/* Thông tin chuyến */}
            <Card title={<><CarOutlined /> Thông tin chuyến xe</>}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Mã chuyến">{tripData.MaChuyen}</Descriptions.Item>
                <Descriptions.Item label="Tuyến đường">{tripData.TenTuyen}</Descriptions.Item>
                <Descriptions.Item label="Điểm đi">{tripData.DiemDi}</Descriptions.Item>
                <Descriptions.Item label="Điểm đến">{tripData.DiemDen}</Descriptions.Item>
                <Descriptions.Item label="Khởi hành">
                  {dayjs(tripData.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Dự kiến đến">
                  {dayjs(tripData.ThoiGianDuKienDen).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Biển số xe">{tripData.BienSoXe}</Descriptions.Item>
                <Descriptions.Item label="Loại xe">{tripData.LoaiXe}</Descriptions.Item>
                <Descriptions.Item label="Tài xế">
                  {tripData.TenTaiXe || <Tag color="orange">Chưa phân công</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT tài xế">
                  {tripData.SDTTaiXe || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Danh sách đơn */}
            <Card 
              title={`Danh sách đơn đặt vé (${tripData.bookings?.length || 0})`}
            >
              {tripData.bookings?.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={tripData.bookings}
                  rowKey="MaDon"
                  pagination={false}
                  scroll={{ x: 1200 }}
                />
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  Không có đơn nào
                </p>
              )}
            </Card>
          </Space>
        </div>
      </Content>
      <Footer />

      {/* Modal Chi tiết đơn */}
      <Modal
        title={<><EyeOutlined /> Chi tiết đơn vé - {selectedBooking?.MaBooking}</>}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        width={800}
        footer={null}
        mask={false}           // ← TẮT màn hình xám
  maskClosable={false}
      >
        {selectedBooking && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Mã đơn">{selectedBooking.MaBooking}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedBooking.TrangThaiTT === 1 ? 'success' : selectedBooking.TrangThaiTT === 2 ? 'warning' : 'error'}>
                  {selectedBooking.TrangThaiTT === 1 ? 'Đã duyệt' : selectedBooking.TrangThaiTT === 2 ? 'Chờ duyệt' : 'Đã hủy'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người đặt">{selectedBooking.NguoiDat}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{selectedBooking.SDT}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedBooking.Email}</Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(selectedBooking.NgayDat).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền" span={2}>
                <strong style={{ color: '#52c41a', fontSize: 16 }}>
                  {selectedBooking.TongTien?.toLocaleString('vi-VN')} đ
                </strong>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Danh sách vé</Divider>

            <List
              dataSource={selectedBooking.DanhSachVe}
              renderItem={(veId, index) => (
                <List.Item
                  actions={[
                    selectedBooking.DanhSachTrangThaiVe[index] === 0 ? (
                      <Popconfirm
                        title="Xác nhận hủy vé này?"
                        onConfirm={() => handleCancelTicket(veId)}
                        okText="Hủy vé"
                        cancelText="Không"
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
                      <Tag color={selectedBooking.DanhSachTrangThaiVe[index] === 1 ? 'success' : 'error'}>
                        {selectedBooking.DanhSachTrangThaiVe[index] === 1 ? 'Đã duyệt' : 'Đã hủy'}
                      </Tag>
                    )
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">Ghế {selectedBooking.DanhSachGhe[index]}</Tag>
                        <span>{selectedBooking.DanhSachTenKhach[index]}</span>
                      </Space>
                    }
                    description={`Mã vé: ${veId}`}
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>

      {/* Modal In danh sách */}
      <Modal
        title={<><PrinterOutlined /> Danh sách hành khách</>}
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        width={1000}
        mask={false}           // ← TẮT màn hình xám
  maskClosable={false}
        footer={
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintDocument}>
            In ngay
          </Button>
        }
      >
        {isPrintLoading ? (
          <p>Đang tải...</p>
        ) : printData ? (
          <div id="print-content">
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <h2>DANH SÁCH HÀNH KHÁCH</h2>
              <p>Chuyến xe: <strong>{printData.MaChuyen}</strong></p>
            </div>

            <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Tuyến" span={2}><strong>{printData.TenTuyen}</strong></Descriptions.Item>
              <Descriptions.Item label="Điểm đi">{printData.DiemDi}</Descriptions.Item>
              <Descriptions.Item label="Điểm đến">{printData.DiemDen}</Descriptions.Item>
              <Descriptions.Item label="Khởi hành">
                {dayjs(printData.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Dự kiến đến">
                {dayjs(printData.ThoiGianDuKienDen).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Xe">{printData.BienSoXe}</Descriptions.Item>
              <Descriptions.Item label="Loại xe">{printData.LoaiXe}</Descriptions.Item>
              <Descriptions.Item label="Tài xế">{printData.TenTaiXe || 'Chưa phân công'}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{printData.SDTTaiXe || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Số khách">
                <Tag color="blue">{printData.totalPassengers}/{printData.SoLuongGhe}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Doanh thu">
                <Tag color="green">{printData.totalRevenue?.toLocaleString('vi-VN')} đ</Tag>
              </Descriptions.Item>
            </Descriptions>

            <h3>Danh sách ({printData.totalPassengers} người)</h3>
            <Table
              columns={passengerColumns}
              dataSource={printData.passengers}
              rowKey="MaVe"
              pagination={false}
              size="small"
              bordered
            />

            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p><strong>Nhân viên thu ngân</strong></p>
                <p style={{ marginTop: 60 }}>(Ký, ghi rõ họ tên)</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p><strong>Tài xế</strong></p>
                <p style={{ marginTop: 60 }}>(Ký, ghi rõ họ tên)</p>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#888' }}>
              <p>In lúc: {dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
};

export default TripDetail;