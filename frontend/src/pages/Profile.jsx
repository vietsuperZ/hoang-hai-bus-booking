import { useState } from 'react';
import { Layout, Card, Descriptions, Button, Modal, Form, Input, message, Space } from 'antd';
import { 
  EditOutlined, 
  LockOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined 
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { setUser } from '../redux/slices/authSlice';
import api from '../services/api';

const { Content } = Layout;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/profile', data);
      return response;
    },
    onSuccess: (response) => {
      message.success('Cập nhật thông tin thành công!');
      const userData = response?.data || response;
      dispatch(setUser(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      setIsEditModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.message || 'Cập nhật thất bại!');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/change-password', data);
      return response;
    },
    onSuccess: () => {
      message.success('Đổi mật khẩu thành công!');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    },
    onError: (error) => {
      message.error(error?.message || 'Đổi mật khẩu thất bại!');
    }
  });

  const handleEdit = () => {
    form.setFieldsValue({
      HoTen: user?.HoTen,
      Email: user?.Email,
      SDT: user?.SDT
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = (values) => {
    updateProfileMutation.mutate({
      HoTen: values.HoTen,
      SDT: values.SDT,
      Email: user?.Email
    });
  };

  const handleChangePassword = (values) => {
    changePasswordMutation.mutate({
      MatKhauCu: values.MatKhauCu,
      MatKhauMoi: values.MatKhauMoi
    });
  };

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <p>Đang tải...</p>
        </Content>
        <Footer />
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card 
            title="Thông tin cá nhân"
            extra={
              <Space>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                  Chỉnh sửa
                </Button>
                <Button icon={<LockOutlined />} onClick={() => setIsPasswordModalVisible(true)}>
                  Đổi mật khẩu
                </Button>
              </Space>
            }
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Họ và tên">{user?.HoTen || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.Email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{user?.SDT || 'N/A'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Content>
      <Footer />

      <Modal
        title="✏️ Chỉnh sửa thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={500}
        mask={false}              // ← THÊM
  maskClosable={false}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item
            name="HoTen"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên!' },
              { min: 3, message: 'Họ tên phải từ 3 ký tự!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item name="Email" label="Email">
            <Input 
              prefix={<MailOutlined />} 
              disabled 
              style={{ color: '#000', backgroundColor: '#f5f5f5' }} 
            />
          </Form.Item>

          <Form.Item
            name="SDT"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0987654321" maxLength={11} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="🔐 Đổi mật khẩu"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
        mask={false}              // ← THÊM
  maskClosable={false}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="MatKhauCu"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="MatKhauMoi"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="XacNhanMatKhau"
            label="Xác nhận mật khẩu mới"
            dependencies={['MatKhauMoi']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('MatKhauMoi') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsPasswordModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={changePasswordMutation.isPending}>
                Đổi mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Profile;