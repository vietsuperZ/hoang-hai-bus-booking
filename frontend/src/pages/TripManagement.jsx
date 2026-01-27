import { useState } from 'react';
import { Layout, Card, Form, DatePicker, Button, Table, Tag, Space } from 'antd';
import { SearchOutlined, EyeOutlined, CarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import api from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;

const TripManagement = () => {
  const navigate = useNavigate();
  const [searchDate, setSearchDate] = useState(dayjs());

  const { data: tripsData, isLoading, refetch } = useQuery({
    queryKey: ['employee-trips', searchDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const response = await api.get('/employee/trips', {
        params: { date: searchDate?.format('YYYY-MM-DD') }
      });
      return response.data;
    },
    enabled: !!searchDate
  });

  const handleSearch = () => {
    refetch();
  };

  const handleViewDetail = (tripId) => {
    navigate(`/employee/trips/${tripId}`);
  };

  const columns = [
  {
    title: 'Mã chuyến',
    dataIndex: 'MaChuyen',
    key: 'MaChuyen',
    width: 100
  },
  {
    title: 'Giờ khởi hành',
    dataIndex: 'ThoiGianKhoiHanh',
    key: 'ThoiGianKhoiHanh',
    render: (time) => dayjs(time).format('HH:mm'),
    width: 100
  },
  {
    title: 'Tuyến đường',
    key: 'route',
    render: (record) => `${record.DiemDi} → ${record.DiemDen}`
  },
  {
    title: 'Xe',
    dataIndex: 'BienSoXe',
    key: 'BienSoXe',
    width: 120
  },
  {
    title: 'Tài xế',
    dataIndex: 'TenTaiXe',
    key: 'TenTaiXe',
    render: (name) => name || <Tag color="orange">Chưa phân công</Tag>
  },
  {
  title: 'Số khách',
  key: 'passengers',
  width: 150,
  render: (record) => (
    <Space direction="vertical" size={0}>
      <span>Đã duyệt: <Tag color="green">{record.SoKhachDaDuyet}/{record.SoLuongGhe}</Tag></span>
      <span>Chờ xử lý: <Tag color="orange">{record.SoKhachChoXuLy}</Tag></span>
    </Space>
  )
},
  {
    title: 'Thao tác',
    key: 'actions',
    width: 120,
    render: (record) => (
      <Button
        type="primary"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => handleViewDetail(record.MaChuyen)}
      >
        Chi tiết
      </Button>
    )
  }
];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Card title={<><CarOutlined /> Quản lý chuyến xe</>}>
            <Form layout="inline" style={{ marginBottom: 20 }}>
              <Form.Item label="Chọn ngày">
                <DatePicker
                  value={searchDate}
                  onChange={setSearchDate}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={isLoading}
                >
                  Tìm kiếm
                </Button>
              </Form.Item>
            </Form>

            <Table
              columns={columns}
              dataSource={tripsData || []}
              rowKey="MaChuyen"
              loading={isLoading}
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default TripManagement;