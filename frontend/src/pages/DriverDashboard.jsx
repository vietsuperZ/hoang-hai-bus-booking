import { useState } from 'react';
import { Layout, Card, Table, Button, Tag, Space, message } from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportPassengerList } from '../services/excelService';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import api from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;

const DriverDashboard = () => {
  // Fetch chuyến xe của tài xế
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trips'); // API lấy chuyến của tài xế
      return response;
    }
  });

  // Mutation xuất Excel
  const exportPassengersMutation = useMutation({
    mutationFn: async (tripId) => {
      const response = await api.get(`/trips/${tripId}/passengers`);
      return response;
    },
    onSuccess: (data) => {
      const { trip, tickets } = data;
      exportPassengerList(trip, tickets);
      message.success('Đã xuất danh sách hành khách!');
    },
    onError: (error) => {
      message.error(error?.message || 'Xuất file thất bại!');
    }
  });

  const trips = tripsData?.data || [];

  const columns = [
    {
      title: 'Ngày khởi hành',
      dataIndex: 'ThoiGianKhoiHanh',
      key: 'ThoiGianKhoiHanh',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Tuyến đường',
      key: 'route',
      render: (_, record) => (
        <div>
          <strong>{record.route.diemDi.TenDiaDiem}</strong>
          {' → '}
          <strong>{record.route.diemDen.TenDiaDiem}</strong>
        </div>
      )
    },
    {
      title: 'Biển số xe',
      key: 'bus',
      render: (_, record) => (
        <Tag color="blue">{record.bus.BienSoXe}</Tag>
      )
    },
    {
      title: 'Số hành khách',
      key: 'passengers',
      align: 'center',
      render: (_, record) => (
        <Tag color="green">{record.bookedSeats || 0} khách</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={() => exportPassengersMutation.mutate(record.MaChuyen)}
            loading={exportPassengersMutation.isPending}
          >
            Xuất danh sách
          </Button>
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
              🚌 Chuyến xe của tôi
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={trips}
            rowKey="MaChuyen"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} chuyến`
            }}
          />
        </Card>
      </Content>
      <Footer />
    </Layout>
  );
};

export default DriverDashboard;
