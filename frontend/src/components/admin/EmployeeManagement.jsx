import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, 
  Select, message, Popconfirm, Tag, Space 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined, UserOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const EmployeeManagement = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Fetch danh sách nhân viên
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: adminService.getAllEmployees
  });

  // Mutation tạo mới
  const createMutation = useMutation({
    mutationFn: adminService.createEmployee,
    onSuccess: () => {
      message.success('Thêm nhân viên thành công!');
      queryClient.invalidateQueries(['admin-employees']);
      handleModalClose();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('Duplicate') || errorMsg?.includes('email')) {
        message.error('Email đã tồn tại!');
      } else {
        message.error(errorMsg || 'Thêm nhân viên thất bại!');
      }
    }
  });

  // Mutation cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateEmployee(id, data),
    onSuccess: () => {
      message.success('Cập nhật nhân viên thành công!');
      queryClient.invalidateQueries(['admin-employees']);
      handleModalClose();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật nhân viên thất bại!');
    }
  });

  // Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteEmployee,
    onSuccess: () => {
      message.success('Xóa nhân viên thành công!');
      queryClient.invalidateQueries(['admin-employees']);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message;
      if (errorMsg?.includes('foreign key') || errorMsg?.includes('chuyến')) {
        message.error('Không thể xóa! Nhân viên đang được phân công.');
      } else {
        message.error(errorMsg || 'Xóa nhân viên thất bại!');
      }
    }
  });

  const employees = employeesData?.data || [];

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      HoTen: employee.user?.HoTen,
      Email: employee.user?.Email,
      SDT: employee.user?.SDT,
      MaChucVu: employee.MaChucVu
    });
    setIsModalVisible(true);
  };

  // Xóa nhân viên
  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // Đóng modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingEmployee(null);
    form.resetFields();
  };

  // Submit form
  const handleSubmit = (values) => {
    const employeeData = {
      HoTen: values.HoTen.trim(),
      Email: values.Email.trim().toLowerCase(),
      SDT: values.SDT.trim(),
      MaChucVu: values.MaChucVu,
      MatKhau: values.MatKhau // Chỉ dùng khi tạo mới
    };

    if (editingEmployee) {
      // Khi update, không gửi MatKhau
      delete employeeData.MatKhau;
      updateMutation.mutate({ id: editingEmployee.MaNhanVien, data: employeeData });
    } else {
      createMutation.mutate(employeeData);
    }
  };

  // Cột bảng
  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'MaNhanVien',
      key: 'MaNhanVien',
      width: 80,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Họ tên',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <strong>{record.user?.HoTen || '---'}</strong>
        </div>
      )
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.user?.Email || '---'
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      render: (_, record) => record.user?.SDT || '---'
    },
    {
      title: 'Chức vụ',
      key: 'position',
      render: (_, record) => {
        const position = record.position?.TenChucVu;
        let color = 'default';
        
        if (position === 'Tài xế') color = 'blue';
        else if (position === 'Phụ xe') color = 'green';
        else if (position === 'Nhân viên Thu ngân') color = 'orange';
        
        return <Tag color={color}>{position || '---'}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: (status) => (
        status === 1 ? (
          <Tag color="success">Đang làm việc</Tag>
        ) : (
          <Tag color="default">Nghỉ việc</Tag>
        )
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
            title="Xóa nhân viên này?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.MaNhanVien)}
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
            👥 Quản lý Nhân viên
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['admin-employees'])}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm nhân viên
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="MaNhanVien"
          loading={employeesLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} nhân viên`
          }}
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingEmployee ? '✏️ Chỉnh sửa nhân viên' : '➕ Thêm nhân viên mới'}
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
            name="HoTen"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên!' },
              { min: 3, message: 'Họ tên phải từ 3 ký tự!' }
            ]}
          >
            <Input 
              placeholder="Nhập họ và tên"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              placeholder="example@hoanghaibus.vn"
              disabled={!!editingEmployee}
            />
          </Form.Item>

          <Form.Item
            name="SDT"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^0\d{9}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input 
              placeholder="0987654321"
              maxLength={10}
            />
          </Form.Item>

          {!editingEmployee && (
            <Form.Item
              name="MatKhau"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự!' }
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item
            name="MaChucVu"
            label="Chức vụ"
            rules={[{ required: true, message: 'Vui lòng chọn chức vụ!' }]}
          >
            <Select placeholder="Chọn chức vụ">
              <Option value={1}>Nhân viên Thu ngân</Option>
              <Option value={2}>Tài xế</Option>
              <Option value={3}>Phụ xe</Option>
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
                {editingEmployee ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;