import { Layout } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;

const Footer = () => {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#f0f2f5', padding: '40px 50px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '20px' }}>
          <div>
            <h3>🚌 Nhà Xe Hoàng Hải</h3>
            <p>Dịch vụ xe khách uy tín, chất lượng hàng đầu miền Trung</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p><PhoneOutlined /> Hotline: 1900-xxxx</p>
            <p><MailOutlined /> Email: contact@hoanghai.com</p>
            <p><EnvironmentOutlined /> Đà Nẵng, Việt Nam</p>
          </div>
          <div>
            <h4>Chính sách</h4>
            <p><a href="#">Quy định chung</a></p>
            <p><a href="#">Chính sách hoàn tiền</a></p>
            <p><a href="#">Điều khoản sử dụng</a></p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: '20px', textAlign: 'center' }}>
          Hoàng Hải Bus Booking © {new Date().getFullYear()} - Đồ án tốt nghiệp
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;