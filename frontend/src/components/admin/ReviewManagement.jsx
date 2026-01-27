import { useState } from 'react';
import { 
  Card, Table, Button, Tag, Space, Select, Input, message, 
  Popconfirm, Rate, Statistic, Row, Col, Modal, Descriptions 
} from 'antd';
import { 
  StarOutlined, DeleteOutlined, EyeOutlined, 
  ReloadOutlined, SearchOutlined, FilterOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Option } = Select;

const ReviewManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    rating: null,
    search: '',
    page: 1
  });
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['review-statistics'],
    queryFn: async () => {
      const response = await api.get('/reviews/admin/statistics');
      return response.data;
    }
  });

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', 20);
      
      const response = await api.get(`/reviews/admin/all?${params.toString()}`);
      return response.data;
    }
  });

  // Mutation delete review
  const deleteMutation = useMutation({
    mutationFn: async (reviewId) => {
      return await api.delete(`/reviews/admin/${reviewId}`);
    },
    onSuccess: () => {
      message.success('Xóa đánh giá thành công!');
      queryClient.invalidateQueries(['admin-reviews']);
      queryClient.invalidateQueries(['review-statistics']);
    },
    onError: (error) => {
      message.error(error?.message || 'Xóa đánh giá thất bại!');
    }
  });

  const handleDelete = (reviewId) => {
    deleteMutation.mutate(reviewId);
  };

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setIsDetailModalVisible(true);
  };

  const stats = statsData || {};
  const reviews = reviewsData?.reviews || [];
  const overview = stats.overview || {};

  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div><strong>{record.KhachHang}</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.SDTKhach}</div>
        </div>
      )
    },
    {
      title: 'Tuyến đường',
      dataIndex: 'TenTuyen',
      key: 'TenTuyen',
      width: 180,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Tài xế',
      key: 'driver',
      width: 150,
      render: (_, record) => (
        record.TenTaiXe ? (
          <div>
            <div>{record.TenTaiXe}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.SDTTaiXe}</div>
          </div>
        ) : (
          <Tag color="orange">Chưa phân công</Tag>
        )
      )
    },
    {
      title: 'Xe',
      key: 'bus',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.BienSoXe}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.LoaiXe}</div>
        </div>
      )
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div>
          <Rate disabled value={record.DiemSo} style={{ fontSize: 14 }} />
        </div>
      )
    },
    {
      title: 'Nội dung',
      dataIndex: 'NoiDung',
      key: 'NoiDung',
      ellipsis: true,
      render: (text) => (
        text ? (
          <span>{text.length > 50 ? text.substring(0, 50) + '...' : text}</span>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>Không có nhận xét</span>
        )
      )
    },
    {
      title: 'Ngày đánh giá',
      dataIndex: 'NgayDanhGia',
      key: 'NgayDanhGia',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Xác nhận xóa đánh giá này?"
            onConfirm={() => handleDelete(record.MaDanhGia)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đánh giá"
              value={overview.totalReviews || 0}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={overview.averageRating || 0}
              precision={1}
              suffix="/ 5"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="5 sao"
              value={overview.fiveStars || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="1-2 sao"
              value={(overview.oneStar || 0) + (overview.twoStars || 0)}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Top Lists */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card title="🏆 Top tuyến đường" size="small">
            {stats.topRoutes?.slice(0, 5).map((route, index) => (
              <div key={index} style={{ 
                padding: '8px 0', 
                borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <Tag color="blue">{route.TenTuyen}</Tag>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    ({route.totalReviews} đánh giá)
                  </span>
                </div>
                <div>
                  <Rate disabled value={route.averageRating} style={{ fontSize: 12 }} />
                  <span style={{ marginLeft: 8, color: '#faad14', fontWeight: 'bold' }}>
                    {parseFloat(route.averageRating).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="👨‍✈️ Top tài xế" size="small">
            {stats.topDrivers?.slice(0, 5).map((driver, index) => (
              <div key={index} style={{ 
                padding: '8px 0', 
                borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{driver.HoTen}</strong>
                  <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                    ({driver.totalReviews} đánh giá)
                  </span>
                </div>
                <div>
                  <Rate disabled value={driver.averageRating} style={{ fontSize: 12 }} />
                  <span style={{ marginLeft: 8, color: '#faad14', fontWeight: 'bold' }}>
                    {parseFloat(driver.averageRating).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <StarOutlined /> Quản lý đánh giá
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries(['admin-reviews'])}
          >
            Làm mới
          </Button>
        }
      >
        {/* Filters */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Input
            placeholder="Tìm theo tên khách hàng hoặc nội dung..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            allowClear
          />
          <Select
            placeholder="Lọc theo số sao"
            style={{ width: 150 }}
            value={filters.rating}
            onChange={(value) => setFilters({ ...filters, rating: value, page: 1 })}
            allowClear
          >
            <Option value={5}>⭐⭐⭐⭐⭐ 5 sao</Option>
            <Option value={4}>⭐⭐⭐⭐ 4 sao</Option>
            <Option value={3}>⭐⭐⭐ 3 sao</Option>
            <Option value={2}>⭐⭐ 2 sao</Option>
            <Option value={1}>⭐ 1 sao</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="MaDanhGia"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: 20,
            total: reviewsData?.total || 0,
            showTotal: (total) => `Tổng ${total} đánh giá`,
            onChange: (page) => setFilters({ ...filters, page })
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={<><EyeOutlined /> Chi tiết đánh giá</>}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReview && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Khách hàng" span={2}>
                <strong>{selectedReview.KhachHang}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedReview.EmailKhach}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {selectedReview.SDTKhach}
              </Descriptions.Item>
              <Descriptions.Item label="Tuyến đường" span={2}>
                <Tag color="blue">{selectedReview.TenTuyen}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khởi hành">
                {dayjs(selectedReview.ThoiGianKhoiHanh).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số xe">
                {selectedReview.BienSoXe}
              </Descriptions.Item>
              <Descriptions.Item label="Loại xe">
                {selectedReview.LoaiXe}
              </Descriptions.Item>
              <Descriptions.Item label="Tài xế">
                {selectedReview.TenTaiXe || <Tag color="orange">Chưa phân công</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT tài xế">
                {selectedReview.SDTTaiXe || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá" span={2}>
                <Rate disabled value={selectedReview.DiemSo} />
                <span style={{ marginLeft: 10, fontSize: 18, color: '#faad14', fontWeight: 'bold' }}>
                  {selectedReview.DiemSo}/5
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung" span={2}>
                <div style={{ 
                  padding: 12, 
                  background: '#f5f5f5', 
                  borderRadius: 8,
                  fontStyle: selectedReview.NoiDung ? 'normal' : 'italic',
                  color: selectedReview.NoiDung ? '#000' : '#999'
                }}>
                  {selectedReview.NoiDung || 'Khách hàng không để lại nhận xét'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đánh giá">
                {dayjs(selectedReview.NgayDanhGia).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setIsDetailModalVisible(false)}>
                  Đóng
                </Button>
                <Popconfirm
                  title="Xác nhận xóa đánh giá này?"
                  onConfirm={() => {
                    handleDelete(selectedReview.MaDanhGia);
                    setIsDetailModalVisible(false);
                  }}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                  >
                    Xóa đánh giá
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewManagement;