import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select } from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  CarOutlined,
  UserOutlined,
  RiseOutlined,
  TrophyOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import adminService from '../../services/adminService';
import dayjs from 'dayjs';

const { Option } = Select;

const DashboardOverview = () => {
  const [revenueType, setRevenueType] = useState('month');

  // Fetch overview stats
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => adminService.getDashboardOverview()
  });

  // Fetch revenue chart
  const { data: revenueChartData } = useQuery({
    queryKey: ['dashboard-revenue-chart'],
    queryFn: () => adminService.getRevenueChart()
  });

  // Fetch top routes
  const { data: topRoutesData } = useQuery({
    queryKey: ['dashboard-top-routes'],
    queryFn: () => adminService.getTopRoutes()
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['dashboard-payment-methods'],
    queryFn: () => adminService.getPaymentMethodStats()
  });

  const overview = overviewData?.data || {};
  const revenueChart = revenueChartData?.data || [];
  const topRoutes = topRoutesData?.data || [];
  const paymentMethods = paymentMethodsData?.data || [];

  // Format tiền
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  // Màu cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Lấy doanh thu theo loại
  const getRevenueByType = () => {
    switch (revenueType) {
      case 'today': return overview.revenue?.today || 0;
      case 'week': return overview.revenue?.week || 0;
      case 'month': return overview.revenue?.month || 0;
      case 'year': return overview.revenue?.year || 0;
      default: return overview.revenue?.month || 0;
    }
  };

  // Cột bảng top tuyến
  const routeColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
        </span>
      )
    },
    {
      title: 'Tuyến đường',
      key: 'route',
      render: (_, record) => (
        <div>
          <strong>{record.DiemDi}</strong> → <strong>{record.DiemDen}</strong>
        </div>
      )
    },
    {
      title: 'Số vé',
      dataIndex: 'SoVe',
      key: 'tickets',
      align: 'center',
      render: (value) => <span style={{ fontWeight: 'bold' }}>{value}</span>
    },
    {
      title: 'Doanh thu',
      dataIndex: 'DoanhThu',
      key: 'revenue',
      align: 'right',
      render: (value) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </span>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>📊 Tổng quan Dashboard</h2>

      {/* Cards thống kê */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Doanh thu
                  <Select
                    size="small"
                    value={revenueType}
                    onChange={setRevenueType}
                    style={{ width: 100 }}
                    bordered={false}
                  >
                    <Option value="today">Hôm nay</Option>
                    <Option value="week">Tuần này</Option>
                    <Option value="month">Tháng này</Option>
                    <Option value="year">Năm này</Option>
                  </Select>
                </div>
              }
              value={getRevenueByType()}
              precision={0}
              formatter={(value) => formatCurrency(value)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="Vé đã bán (tháng)"
              value={overview.tickets?.month || 0}
              prefix={<FileTextOutlined />}
              suffix="vé"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="Chuyến xe (hôm nay)"
              value={overview.trips?.today || 0}
              prefix={<CarOutlined />}
              suffix={`/ ${overview.trips?.total || 0}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="Người dùng"
              value={overview.users?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ doanh thu */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                <RiseOutlined /> Doanh thu 30 ngày gần nhất
              </span>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChart.map(item => ({
                date: dayjs(item.date).format('DD/MM'),
                revenue: parseFloat(item.revenue)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Doanh thu"
                  dot={{ fill: '#1890ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <CreditCardOutlined /> Phương thức thanh toán
              </span>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods.map(item => ({
                    name: item.name,
                    value: parseFloat(item.total)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top tuyến đường */}
      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <TrophyOutlined /> Top 10 tuyến đường có doanh thu cao nhất
              </span>
            }
          >
            <Table
              columns={routeColumns}
              dataSource={topRoutes}
              rowKey="MaTuyen"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardOverview;