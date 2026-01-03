import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, 
  Select, message, Popconfirm, Tag, Space, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined, EnvironmentOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const LocationManagement = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Fetch danh sách địa điểm
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: adminService.getAllLocations
  });

  // Fetch routes để check địa điểm nào đang được dùng
  const { data: routesData } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: adminService.getAllRoutes
  });

  // Mutation tạo mới
  const createMutation = useMutation({
    mutationFn: adminService.createLocation,
    onSuccess: () => {
      message.success('Thêm địa điểm thành công!');
      queryClient.invalidateQueries(['admin-locations']);
      handleModalClose();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('Duplicate') || errorMsg?.includes('tồn tại')) {
        message.error('Địa điểm đã tồn tại!');
      } else {
        message.error(errorMsg || 'Thêm địa điểm thất bại!');
      }
    }
  });

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateLocation(id, data),
    onSuccess: () => {
      message.success('Cập nhật địa điểm thành công!');
      queryClient.invalidateQueries(['admin-locations']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật địa điểm thất bại!');
    }
  });

  // Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteLocation,
    onSuccess: () => {
      message.success('Xóa địa điểm thành công!');
      queryClient.invalidateQueries(['admin-locations']);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('tuyến')) {
        message.error('Không thể xóa! Địa điểm đang được sử dụng trong tuyến đường.');
      } else {
        message.error(errorMsg || 'Xóa địa điểm thất bại!');
      }
    }
  });

  const locations = locationsData?.data || [];
  const routes = routesData?.data || [];
  
  // Kiểm tra địa điểm có được dùng trong tuyến không
  const isLocationInUse = (locationId) => {
    return routes.some(route => 
      route.DiemDi_ID === locationId || route.DiemDen_ID === locationId
    );
  };

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingLocation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (location) => {
    setEditingLocation(location);
    form.setFieldsValue({
      TenDiaDiem: location.TenDiaDiem,
      TenTinh: location.TenTinh
    });
    setIsModalVisible(true);
  };

  // Xóa địa điểm
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingLocation(null);
    form.resetFields();
  };

  // Submit form
  const handleSubmit = (values) => {
    const locationData = {
      TenDiaDiem: values.TenDiaDiem.trim(),
      TenTinh: values.TenTinh.trim()
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.MaDiaDiem, data: locationData });
    } else {
      createMutation.mutate(locationData);
    }
  };

  // Danh sách tỉnh thành Việt Nam (miền Trung - Tây Nguyên)
  const provinces = [
    'Đà Nẵng',
    'Quảng Nam',
    'Quảng Ngãi',
    'Bình Định',
    'Phú Yên',
    'Khánh Hòa',
    'Ninh Thuận',
    'Bình Thuận',
    'Kon Tum',
    'Gia Lai',
    'Đắk Lắk',
    'Đắk Nông',
    'Lâm Đồng',
    'Thừa Thiên Huế',
    'Quảng Trị',
    'Quảng Bình'
  ];

  // Cột bảng
  const columns = [
    {
      title: 'Mã',
      dataIndex: 'MaDiaDiem',
      key: 'MaDiaDiem',
      width: 80,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Tên địa điểm',
      dataIndex: 'TenDiaDiem',
      key: 'TenDiaDiem',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </div>
      )
    },
    {
      title: 'Tỉnh/Thành phố',
      dataIndex: 'TenTinh',
      key: 'TenTinh',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const inUse = isLocationInUse(record.MaDiaDiem);
        return inUse ? (
          <Tag color="success">Đang sử dụng</Tag>
        ) : (
          <Tag color="default">Chưa sử dụng</Tag>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const inUse = isLocationInUse(record.MaDiaDiem);
        
        return (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
            
            {inUse ? (
              <Tooltip title="Không thể xóa! Địa điểm đang được sử dụng trong tuyến đường">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  disabled
                >
                  Xóa
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Xóa địa điểm này?"
                description="Bạn có chắc chắn muốn xóa?"
                onConfirm={() => handleDelete(record.MaDiaDiem)}
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
            📍 Quản lý Địa điểm
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-locations'])}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm địa điểm
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={locations}
          rowKey="MaDiaDiem"
          loading={locationsLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} địa điểm`
          }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingLocation ? '✏️ Chỉnh sửa địa điểm' : '➕ Thêm địa điểm mới'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={500}
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
            name="TenDiaDiem"
            label="Tên địa điểm"
            rules={[
              { required: true, message: 'Vui lòng nhập tên địa điểm!' },
              { min: 5, message: 'Tên địa điểm phải từ 5 ký tự!' }
            ]}
          >
            <Input 
              placeholder="VD: Bến xe Đà Nẵng"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="TenTinh"
            label="Tỉnh/Thành phố"
            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố!' }]}
          >
            <Select
              placeholder="Chọn tỉnh/thành phố"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {provinces.map((province) => (
                <Option key={province} value={province}>
                  {province}
                </Option>
              ))}
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
                {editingLocation ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationManagement;