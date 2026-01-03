import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, InputNumber, 
  Select, message, Popconfirm, Tag, Space, Tooltip 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const BusManagement = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState(null);

  // Fetch danh sách xe
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['admin-buses'],
    queryFn: adminService.getAllBuses
  });

  // Mutation tạo mới
  const createMutation = useMutation({
    mutationFn: adminService.createBus,
    onSuccess: () => {
      message.success('Thêm xe thành công!');
      queryClient.invalidateQueries(['admin-buses']);
      handleModalClose();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('Duplicate') || errorMsg?.includes('biển số')) {
        message.error('Biển số xe đã tồn tại!');
      } else {
        message.error(errorMsg || 'Thêm xe thất bại!');
      }
    }
  });

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateBus(id, data),
    onSuccess: () => {
      message.success('Cập nhật xe thành công!');
      queryClient.invalidateQueries(['admin-buses']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật xe thất bại!');
    }
  });

  // Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteBus,
    onSuccess: () => {
      message.success('Xóa xe thành công!');
      queryClient.invalidateQueries(['admin-buses']);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('chuyến')) {
        message.error('Không thể xóa! Xe đang có chuyến xe.');
      } else {
        message.error(errorMsg || 'Xóa xe thất bại!');
      }
    }
  });

  // Fetch trips để check xe nào đang có chuyến
  const { data: tripsData } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: adminService.getAllTrips
  });

  const buses = busesData?.data || [];
  const trips = tripsData?.data || [];
  
  // Kiểm tra xe có chuyến không
  const hasTripOnBus = (bienSoXe) => {
    return trips.some(trip => trip.BienSoXe === bienSoXe);
  };

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingBus(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (bus) => {
    setEditingBus(bus);
    form.setFieldsValue({
      BienSoXe: bus.BienSoXe,
      LoaiXe: bus.LoaiXe,
      SoLuongGhe: bus.SoLuongGhe,
      NamSanXuat: bus.NamSanXuat
    });
    setIsModalVisible(true);
  };

  // Xóa xe
  const handleDelete = (bienSoXe) => {
    deleteMutation.mutate(bienSoXe);
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingBus(null);
    form.resetFields();
  };

  // Submit form
  const handleSubmit = (values) => {
    const busData = {
      BienSoXe: values.BienSoXe.trim().toUpperCase(),
      LoaiXe: values.LoaiXe.trim(),
      SoLuongGhe: values.SoLuongGhe,
      NamSanXuat: values.NamSanXuat
    };

    if (editingBus) {
      updateMutation.mutate({ id: editingBus.BienSoXe, data: busData });
    } else {
      createMutation.mutate(busData);
    }
  };

  // Cột bảng
  const columns = [
    {
      title: 'Biển số xe',
      dataIndex: 'BienSoXe',
      key: 'BienSoXe',
      render: (text) => <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>{text}</Tag>
    },
    {
      title: 'Loại xe',
      dataIndex: 'LoaiXe',
      key: 'LoaiXe',
      render: (type) => {
        let color = 'default';
        if (type?.includes('Giường nằm')) color = 'purple';
        else if (type?.includes('Limousine')) color = 'gold';
        else if (type?.includes('Ghế ngồi')) color = 'green';
        
        return <Tag color={color}>{type}</Tag>;
      }
    },
    {
      title: 'Số ghế',
      dataIndex: 'SoLuongGhe',
      key: 'SoLuongGhe',
      align: 'center',
      render: (seats) => (
        <Tag color="cyan" style={{ fontSize: '13px' }}>
          {seats} ghế
        </Tag>
      )
    },
    {
      title: 'Năm sản xuất',
      dataIndex: 'NamSanXuat',
      key: 'NamSanXuat',
      align: 'center'
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const hasTrip = hasTripOnBus(record.BienSoXe);
        
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
            
            {hasTrip ? (
              <Tooltip title="Không thể xóa! Xe đang có chuyến xe">
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
                title="Xóa xe này?"
                description="Bạn có chắc chắn muốn xóa?"
                onConfirm={() => handleDelete(record.BienSoXe)}
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
            🚌 Quản lý Xe
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-buses'])}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm xe
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={buses}
          rowKey="BienSoXe"
          loading={busesLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} xe`
          }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingBus ? '✏️ Chỉnh sửa xe' : '➕ Thêm xe mới'}
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
            name="BienSoXe"
            label="Biển số xe"
            rules={[
              { required: true, message: 'Vui lòng nhập biển số xe!' },
              { 
                pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/,
                message: 'Biển số không đúng định dạng! (VD: 43A-12345)'
              }
            ]}
          >
            <Input 
              placeholder="VD: 43A-12345" 
              disabled={!!editingBus}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name="LoaiXe"
            label="Loại xe"
            rules={[{ required: true, message: 'Vui lòng chọn loại xe!' }]}
          >
            <Select placeholder="Chọn loại xe">
              <Option value="Ghế ngồi">Ghế ngồi</Option>
              <Option value="Giường nằm">Giường nằm</Option>
              <Option value="Limousine">Limousine</Option>
              <Option value="Giường nằm cao cấp">Giường nằm cao cấp</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="SoLuongGhe"
            label="Số lượng ghế"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng ghế!' },
              { type: 'number', min: 10, max: 50, message: 'Số ghế từ 10-50!' }
            ]}
          >
            <InputNumber
              placeholder="Nhập số ghế"
              style={{ width: '100%' }}
              min={10}
              max={50}
            />
          </Form.Item>

          <Form.Item
            name="NamSanXuat"
            label="Năm sản xuất"
            rules={[
              { required: true, message: 'Vui lòng nhập năm sản xuất!' },
              { 
                type: 'number', 
                min: 2000, 
                max: new Date().getFullYear() + 1,
                message: `Năm sản xuất từ 2000-${new Date().getFullYear() + 1}!` 
              }
            ]}
          >
            <InputNumber
              placeholder="VD: 2020"
              style={{ width: '100%' }}
              min={2000}
              max={new Date().getFullYear() + 1}
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
                {editingBus ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BusManagement;