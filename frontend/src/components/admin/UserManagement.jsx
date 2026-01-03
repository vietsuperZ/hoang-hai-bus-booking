import { useState } from 'react';
import { 
  Card, Table, Button, Modal, Tag, Space, Input, Select, Descriptions, Form
} from 'antd';
import { 
  EyeOutlined, ReloadOutlined, SearchOutlined, 
  UserOutlined, LockOutlined, UnlockOutlined, EditOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import dayjs from 'dayjs';
import adminService from '../../services/adminService.js';

const { Option } = Select;

const UserManagement = () => {
  const queryClient = useQueryClient();
  
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  // Fetch danh sách users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminService.getAllUsers(filters)
  });

  // Mutation khóa/mở khóa user
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateUserStatus(id, status),
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries(['admin-users']);
      setIsDetailModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật thất bại!');
    }
  });

  // Mutation cập nhật role
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleId }) => adminService.updateUserRole(id, roleId),
    onSuccess: () => {
      message.success('Cập nhật vai trò thành công!');
      queryClient.invalidateQueries(['admin-users']);
      setIsRoleModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Cập nhật vai trò thất bại!');
    }
  });

  const users = usersData?.data || [];

  // Xem chi tiết user
  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalVisible(true);
  };

  // Mở modal cập nhật role
  const handleUpdateRole = (user) => {
    setSelectedUser(user);
    setIsRoleModalVisible(true);
  };

  // Submit cập nhật role
  const handleRoleSubmit = (values) => {
    updateRoleMutation.mutate({
      id: selectedUser.MaNguoiDung,
      roleId: values.MaVaiTro
    });
  };

  // Khóa/Mở khóa user
  const handleToggleStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    toggleStatusMutation.mutate({ id: userId, status: newStatus });
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsDetailModalVisible(false);
    setSelectedUser(null);
  };

  // Format ngày
  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
  };

  // Render role tags
  const renderRoles = (roles) => {
    if (!roles || roles.length === 0) return <Tag>Không có vai trò</Tag>;
    
    return roles.map(role => {
      let color = 'default';
      if (role.TenVaiTro === 'Admin') color = 'red';
      else if (role.TenVaiTro === 'Nhân viên') color = 'blue';
      else if (role.TenVaiTro === 'Khách hàng') color = 'green';
      
      return <Tag key={role.MaVaiTro} color={color}>{role.TenVaiTro}</Tag>;
    });
  };

  // Render trạng thái
  const renderStatus = (status) => {
    return status === 1 ? (
      <Tag color="success" icon={<UnlockOutlined />}>Hoạt động</Tag>
    ) : (
      <Tag color="error" icon={<LockOutlined />}>Đã khóa</Tag>
    );
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    // Filter by role
    if (filters.role !== 'all') {
      const hasRole = user.roles?.some(r => r.TenVaiTro === filters.role);
      if (!hasRole) return false;
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      if (user.TrangThai !== parseInt(filters.status)) return false;
    }
    
    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchName = user.HoTen?.toLowerCase().includes(searchLower);
      const matchEmail = user.Email?.toLowerCase().includes(searchLower);
      const matchPhone = user.SDT?.includes(filters.search);
      
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    
    return true;
  });

  // Cột bảng
  const columns = [
    {
      title: 'Mã',
      dataIndex: 'MaNguoiDung',
      key: 'MaNguoiDung',
      width: 80,
      render: (text) => <Tag color="blue">#{text}</Tag>
    },
    {
      title: 'Họ tên',
      dataIndex: 'HoTen',
      key: 'HoTen',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email'
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'SDT',
      key: 'SDT'
    },
    {
      title: 'Vai trò',
      key: 'roles',
      render: (_, record) => renderRoles(record.roles)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: renderStatus
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDate
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 250,
      render: (_, record) => {
        // Chỉ ẩn nút Khóa nếu có role Admin
        const isAdmin = record.roles?.some(r => r.TenVaiTro === 'Admin');
        
        return (
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            >
              Xem
            </Button>

            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleUpdateRole(record)}
            >
              Vai trò
            </Button>
            
            {!isAdmin && (
              <Button
                type={record.TrangThai === 1 ? 'default' : 'primary'}
                danger={record.TrangThai === 1}
                icon={record.TrangThai === 1 ? <LockOutlined /> : <UnlockOutlined />}
                size="small"
                onClick={() => handleToggleStatus(record.MaNguoiDung, record.TrangThai)}
                loading={toggleStatusMutation.isPending}
              >
                {record.TrangThai === 1 ? 'Khóa' : 'Mở'}
              </Button>
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
            👤 Quản lý Tài khoản
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries(['admin-users'])}
          >
            Làm mới
          </Button>
        }
      >
        {/* Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Tìm theo tên, email, SĐT..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />

          <Select
            placeholder="Vai trò"
            style={{ width: 150 }}
            value={filters.role}
            onChange={(value) => setFilters({ ...filters, role: value })}
          >
            <Option value="all">Tất cả vai trò</Option>
            <Option value="Admin">Admin</Option>
            <Option value="Nhân viên">Nhân viên</Option>
            <Option value="Khách hàng">Khách hàng</Option>
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Đã khóa</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="MaNguoiDung"
          loading={usersLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} tài khoản`
          }}
        />
      </Card>

      {/* Modal Chi tiết */}
      <Modal
        title="👤 Chi tiết tài khoản"
        open={isDetailModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        destroyOnClose
        mask={false}
        maskClosable={false}
      >
        {selectedUser && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã người dùng" span={2}>
                <Tag color="blue">#{selectedUser.MaNguoiDung}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Họ tên" span={2}>
                <strong>{selectedUser.HoTen}</strong>
              </Descriptions.Item>
              
              <Descriptions.Item label="Email" span={2}>
                {selectedUser.Email}
              </Descriptions.Item>
              
              <Descriptions.Item label="Số điện thoại">
                {selectedUser.SDT}
              </Descriptions.Item>
              
              <Descriptions.Item label="Vai trò">
                {renderRoles(selectedUser.roles)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Trạng thái" span={2}>
                {renderStatus(selectedUser.TrangThai)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Ngày đăng ký">
                {formatDate(selectedUser.createdAt)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Cập nhật lần cuối">
                {formatDate(selectedUser.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            {/* Nút khóa/mở khóa */}
            {!selectedUser.roles?.some(r => r.TenVaiTro === 'Admin') && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleCloseModal}>
                    Đóng
                  </Button>
                  <Button
                    type={selectedUser.TrangThai === 1 ? 'default' : 'primary'}
                    danger={selectedUser.TrangThai === 1}
                    icon={selectedUser.TrangThai === 1 ? <LockOutlined /> : <UnlockOutlined />}
                    onClick={() => handleToggleStatus(selectedUser.MaNguoiDung, selectedUser.TrangThai)}
                    loading={toggleStatusMutation.isPending}
                  >
                    {selectedUser.TrangThai === 1 ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Cập nhật vai trò */}
      <Modal
        title="✏️ Cập nhật vai trò"
        open={isRoleModalVisible}
        onCancel={() => setIsRoleModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
        mask={false}
        maskClosable={false}
      >
        {selectedUser && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
              <strong>Người dùng:</strong> {selectedUser.HoTen}<br />
              <strong>Email:</strong> {selectedUser.Email}<br />
              <strong>Vai trò hiện tại:</strong> {renderRoles(selectedUser.roles)}
            </div>

            <Form
              layout="vertical"
              onFinish={handleRoleSubmit}
              initialValues={{
                MaVaiTro: selectedUser.roles?.[0]?.MaVaiTro || 3
              }}
            >
              <Form.Item
                name="MaVaiTro"
                label="Vai trò mới"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value={1}>Admin</Option>
                  <Option value={2}>Nhân viên</Option>
                  <Option value={3}>Khách hàng</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setIsRoleModalVisible(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateRoleMutation.isPending}
                  >
                    Cập nhật
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;