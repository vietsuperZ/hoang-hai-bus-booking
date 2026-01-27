import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, DatePicker, 
  Select, message, Popconfirm, Tag, Space 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const TripManagement = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Fetch danh sách chuyến xe
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: adminService.getAllTrips
  });

  // Fetch danh sách tuyến đường
  const { data: routesData } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: adminService.getAllRoutes
  });

  // Fetch danh sách xe
  const { data: busesData } = useQuery({
    queryKey: ['admin-buses'],
    queryFn: adminService.getAllBuses
  });

  // Mutation tạo mới
  const createMutation = useMutation({
    mutationFn: adminService.createTrip,
    onSuccess: () => {
      message.success('Tạo chuyến xe thành công!');
      queryClient.invalidateQueries(['admin-trips']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.message || 'Tạo chuyến xe thất bại!');
    }
  });

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateTrip(id, data),
    onSuccess: () => {
      message.success('Cập nhật chuyến xe thành công!');
      queryClient.invalidateQueries(['admin-trips']);
      handleModalClose();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      console.error('❌ Update error:', error);
      
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('MaTaiXe') || errorMsg?.includes('MaLoXe')) {
        message.error('Mã tài xế hoặc mã lơ xe không tồn tại! Vui lòng để trống hoặc nhập mã đúng.');
      } else {
        message.error(errorMsg || 'Cập nhật chuyến xe thất bại!');
      }
    }
  });

  // Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteTrip,
    onSuccess: () => {
      message.success('Xóa chuyến xe thành công!');
      queryClient.invalidateQueries(['admin-trips']);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('vé')) {
        message.error('Không thể xóa! Chuyến xe đang có vé đã đặt.');
      } else {
        message.error(errorMsg || 'Xóa chuyến xe thất bại!');
      }
    }
  });

  // Fetch danh sách nhân viên
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: adminService.getAllEmployees
  });

  const trips = tripsData?.data || [];
  const routes = routesData?.data || [];
  const buses = busesData?.data || [];
  const employees = employeesData?.data || [];

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingTrip(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (trip) => {
    setEditingTrip(trip);
    form.setFieldsValue({
      MaTuyen: trip.MaTuyen,
      BienSoXe: trip.BienSoXe,
      ThoiGianKhoiHanh: dayjs(trip.ThoiGianKhoiHanh),
      ThoiGianDuKienDen: dayjs(trip.ThoiGianDuKienDen),
      MaTaiXe: trip.MaTaiXe,
      MaLoXe: trip.MaLoXe
    });
    setIsModalVisible(true);
  };

  // Xóa chuyến xe
  const handleDelete = (id) => {
    console.log('🗑️ handleDelete called with id:', id);
    deleteMutation.mutate(id);
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingTrip(null);
    form.resetFields();
  };

  // Submit form
  const handleSubmit = (values) => {
    console.log('🔥 handleSubmit called with values:', values);
    console.log('🔥 editingTrip:', editingTrip);
    
    // Hàm chuyển value sang number hoặc null
    const parseIntOrNull = (val) => {
      if (val === null || val === undefined || val === '') return null;
      // Nếu đã là number thì return luôn
      if (typeof val === 'number') return val;
      // Nếu là string thì parse
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    };
    
    const tripData = {
      MaTuyen: values.MaTuyen,
      BienSoXe: values.BienSoXe,
      ThoiGianKhoiHanh: values.ThoiGianKhoiHanh.toISOString(),
      ThoiGianDuKienDen: values.ThoiGianDuKienDen.toISOString(),
      MaTaiXe: parseIntOrNull(values.MaTaiXe),
      MaLoXe: parseIntOrNull(values.MaLoXe)
    };

    console.log('🔥 tripData:', tripData);

    if (editingTrip) {
      console.log('🔥 Calling UPDATE with id:', editingTrip.MaChuyen);
      updateMutation.mutate({ id: editingTrip.MaChuyen, data: tripData });
    } else {
      console.log('🔥 Calling CREATE');
      createMutation.mutate(tripData);
    }
  };

  const formatDateTime = (dateTime) => {
    return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
  };

  // Cột bảng
  const columns = [
    {
      title: 'Mã chuyến',
      dataIndex: 'MaChuyen',
      key: 'MaChuyen',
      width: 100,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Tuyến đường',
      key: 'route',
      render: (_, record) => (
        <div>
          <div><strong>{record.route?.diemDi?.TenDiaDiem || '---'}</strong></div>
          <div style={{ color: '#999' }}>↓</div>
          <div><strong>{record.route?.diemDen?.TenDiaDiem || '---'}</strong></div>
        </div>
      )
    },
    {
      title: 'Xe',
      key: 'bus',
      render: (_, record) => (
        <div>
          <Tag color="green">{record.bus?.BienSoXe || '---'}</Tag>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.bus?.LoaiXe || '---'} - {record.bus?.SoLuongGhe || 0} ghế
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian khởi hành',
      dataIndex: 'ThoiGianKhoiHanh',
      key: 'ThoiGianKhoiHanh',
      render: (time) => formatDateTime(time)
    },
    {
      title: 'Dự kiến đến',
      dataIndex: 'ThoiGianDuKienDen',
      key: 'ThoiGianDuKienDen',
      render: (time) => formatDateTime(time)
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa chuyến xe này?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.MaChuyen)}
            okText="Xóa"
            cancelText="Hủy"
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
      <Card
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            🚌 Quản lý Chuyến xe
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-trips'])}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm chuyến xe
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={trips}
          rowKey="MaChuyen"
          loading={tripsLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} chuyến`
          }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingTrip ? '✏️ Chỉnh sửa chuyến xe' : '➕ Thêm chuyến xe mới'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
        destroyOnClose
        mask={false}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="MaTuyen"
            label="Tuyến đường"
            rules={[{ required: true, message: 'Vui lòng chọn tuyến đường!' }]}
          >
            <Select
              placeholder="Chọn tuyến đường"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {routes.map((route) => (
                <Option key={route.MaTuyen} value={route.MaTuyen}>
                  {route.diemDi?.TenDiaDiem} → {route.diemDen?.TenDiaDiem}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="BienSoXe"
            label="Xe"
            rules={[{ required: true, message: 'Vui lòng chọn xe!' }]}
          >
            <Select
              placeholder="Chọn xe"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {buses.map((bus) => (
                <Option key={bus.BienSoXe} value={bus.BienSoXe}>
                  {bus.BienSoXe} - {bus.LoaiXe} ({bus.SoLuongGhe} ghế)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="ThoiGianKhoiHanh"
            label="Thời gian khởi hành"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian khởi hành!' }]}
          >
            <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            placeholder="Chọn thời gian khởi hành"
  // Không cho phép chọn ngày trước ngày hôm nay
            disabledDate={(current) => current && current < dayjs().startOf('day')}
  // Bạn cũng có thể thêm logic để chặn giờ trong quá khứ nếu chọn ngày hôm nay
/>
          </Form.Item>

          <Form.Item
            name="ThoiGianDuKienDen"
            label="Thời gian dự kiến đến"
            rules={[
              { required: true, message: 'Vui lòng chọn thời gian dự kiến đến!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const departure = getFieldValue('ThoiGianKhoiHanh');
                  if (!value || !departure || value.isAfter(departure)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Thời gian đến phải sau thời gian khởi hành!'));
                }
              })
            ]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn thời gian dự kiến đến"
            />
          </Form.Item>

          <Form.Item
            name="MaTaiXe"
            label="Tài xế (tùy chọn)"
          >
            <Select 
              placeholder="Chọn tài xế"
              showSearch
              allowClear
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees
                .filter(emp => emp.position?.TenChucVu === 'Tài xế')
                .map((emp) => (
                  <Option key={emp.MaNhanVien} value={emp.MaNhanVien}>
                    {emp.user?.HoTen || `Nhân viên #${emp.MaNhanVien}`}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            name="MaLoXe"
            label="Phụ xe (tùy chọn)"
          >
            <Select 
              placeholder="Chọn phụ xe"
              showSearch
              allowClear
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees
                .filter(emp => emp.position?.TenChucVu === 'Phụ xe')
                .map((emp) => (
                  <Option key={emp.MaNhanVien} value={emp.MaNhanVien}>
                    {emp.user?.HoTen || `Nhân viên #${emp.MaNhanVien}`}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingTrip ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TripManagement;