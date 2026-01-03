import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, InputNumber, 
  Select, message, Popconfirm, Tag, Space 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const RouteManagement = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Fetch danh sách tuyến đường
  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: adminService.getAllRoutes
  });

  // Fetch danh sách địa điểm
  const { data: locationsData } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: adminService.getAllLocations
  });

  // Mutation tạo mới
  const createMutation = useMutation({
    mutationFn: adminService.createRoute,
    onSuccess: () => {
      message.success('Tạo tuyến đường thành công!');
      queryClient.invalidateQueries(['admin-routes']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Tạo tuyến đường thất bại!');
    }
  });

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateRoute(id, data),
    onSuccess: () => {
      message.success('Cập nhật tuyến đường thành công!');
      queryClient.invalidateQueries(['admin-routes']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật tuyến đường thất bại!');
    }
  });

  // Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteRoute,
    onSuccess: () => {
      message.success('Xóa tuyến đường thành công!');
      queryClient.invalidateQueries(['admin-routes']);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('chuyến')) {
        message.error('Không thể xóa! Tuyến đường đang có chuyến xe.');
      } else {
        message.error(errorMsg || 'Xóa tuyến đường thất bại!');
      }
    }
  });

  const routes = routesData?.data || [];
  const locations = locationsData?.data || [];

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingRoute(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (route) => {
    setEditingRoute(route);
    form.setFieldsValue({
      DiemDi_ID: route.DiemDi_ID,
      DiemDen_ID: route.DiemDen_ID,
      KhoangCach: route.KhoangCach,
      ThoiGianDuKien: route.ThoiGianDuKien,
      GiaCoBan: route.GiaCoBan
    });
    setIsModalVisible(true);
  };

  // Xóa tuyến đường
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingRoute(null);
    form.resetFields();
  };

  // Submit form
  const handleSubmit = (values) => {
    const routeData = {
      DiemDi_ID: values.DiemDi_ID,
      DiemDen_ID: values.DiemDen_ID,
      KhoangCach: values.KhoangCach,
      ThoiGianDuKien: values.ThoiGianDuKien,
      GiaCoBan: values.GiaCoBan
    };

    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.MaTuyen, data: routeData });
    } else {
      createMutation.mutate(routeData);
    }
  };

  // Cột bảng
  const columns = [
    {
      title: 'Mã tuyến',
      dataIndex: 'MaTuyen',
      key: 'MaTuyen',
      width: 100,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Điểm đi',
      key: 'diemDi',
      render: (_, record) => (
        <div>
          <div><strong>{record.diemDi?.TenDiaDiem || '---'}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.diemDi?.TenTinh || ''}</div>
        </div>
      )
    },
    {
      title: 'Điểm đến',
      key: 'diemDen',
      render: (_, record) => (
        <div>
          <div><strong>{record.diemDen?.TenDiaDiem || '---'}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.diemDen?.TenTinh || ''}</div>
        </div>
      )
    },
    {
      title: 'Khoảng cách',
      dataIndex: 'KhoangCach',
      key: 'KhoangCach',
      render: (km) => `${km} km`
    },
    {
      title: 'Thời gian dự kiến',
      dataIndex: 'ThoiGianDuKien',
      key: 'ThoiGianDuKien',
      render: (time) => time || '---'
    },
    {
      title: 'Giá cơ bản',
      dataIndex: 'GiaCoBan',
      key: 'GiaCoBan',
      render: (price) => (
        <Tag color="green" style={{ fontSize: '14px' }}>
          {price?.toLocaleString('vi-VN')} VNĐ
        </Tag>
      )
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
            title="Xóa tuyến đường này?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.MaTuyen)}
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
            🛣️ Quản lý Tuyến đường
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-routes'])}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm tuyến đường
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={routes}
          rowKey="MaTuyen"
          loading={routesLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} tuyến`
          }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingRoute ? '✏️ Chỉnh sửa tuyến đường' : '➕ Thêm tuyến đường mới'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
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
            name="DiemDi_ID"
            label="Điểm đi"
            rules={[
              { required: true, message: 'Vui lòng chọn điểm đi!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const diemDen = getFieldValue('DiemDen_ID');
                  if (!value || !diemDen || value !== diemDen) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Điểm đi và điểm đến phải khác nhau!'));
                }
              })
            ]}
          >
            <Select
              placeholder="Chọn điểm đi"
              showSearch
              disabled={!!editingRoute}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {locations.map((loc) => (
                <Option key={loc.MaDiaDiem} value={loc.MaDiaDiem}>
                  {loc.TenDiaDiem} - {loc.TenTinh}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="DiemDen_ID"
            label="Điểm đến"
            rules={[
              { required: true, message: 'Vui lòng chọn điểm đến!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const diemDi = getFieldValue('DiemDi_ID');
                  if (!value || !diemDi || value !== diemDi) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Điểm đi và điểm đến phải khác nhau!'));
                }
              })
            ]}
          >
            <Select
              placeholder="Chọn điểm đến"
              showSearch
              disabled={!!editingRoute}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {locations.map((loc) => (
                <Option key={loc.MaDiaDiem} value={loc.MaDiaDiem}>
                  {loc.TenDiaDiem} - {loc.TenTinh}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="KhoangCach"
            label="Khoảng cách (km)"
            rules={[
              { required: true, message: 'Vui lòng nhập khoảng cách!' },
              { type: 'number', min: 1, message: 'Khoảng cách phải lớn hơn 0!' }
            ]}
          >
            <InputNumber
              placeholder="Nhập khoảng cách"
              style={{ width: '100%' }}
              min={1}
              addonAfter="km"
            />
          </Form.Item>

          <Form.Item
            name="ThoiGianDuKien"
            label="Thời gian dự kiến"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian dự kiến!' }]}
          >
            <Input placeholder="Ví dụ: 2 giờ 30 phút" />
          </Form.Item>

          <Form.Item
            name="GiaCoBan"
            label="Giá cơ bản (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá!' },
              { type: 'number', min: 1000, message: 'Giá phải từ 1,000 VNĐ trở lên!' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá vé"
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              addonAfter="VNĐ"
            />
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
                {editingRoute ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RouteManagement;