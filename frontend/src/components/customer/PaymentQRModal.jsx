import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, Statistic, Card, Steps, message, Spin } from 'antd';
import { QrcodeOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import bookingService from '../../services/bookingService';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

const PaymentQRModal = ({ visible, onCancel, onSuccess, bookingData }) => {
  const [step, setStep] = useState(0);
  const [deadline, setDeadline] = useState(Date.now() + 15 * 60 * 1000);
  const [checking, setChecking] = useState(false);

  // THAY ĐỔI THÔNG TIN NÀY THÀNH THÔNG TIN NGÂN HÀNG CỦA BẠN
  const bankInfo = {
    bankId: 'VCB', // VCB=Vietcombank, TPB=TPBank, MB=MBBank, VPB=VPBank
    accountNumber: '1234567890', // SỐ TÀI KHOẢN THẬT CỦA BẠN
    accountName: 'NGUYEN VAN A', // TÊN TÀI KHOẢN
    amount: bookingData?.amount || 0,
    content: bookingData?.bookingCode || '' // Mã booking làm nội dung CK
  };

  useEffect(() => {
    if (visible && bookingData) {
      setStep(0);
      setDeadline(Date.now() + 15 * 60 * 1000);
    }
  }, [visible, bookingData]);

  // Auto check payment mỗi 5 giây
  useEffect(() => {
    let interval;
    if (visible && step === 1) {
      interval = setInterval(() => {
        checkPayment();
      }, 5000); // Check mỗi 5 giây
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, step, bookingData]);

  // Tạo QR Code với VietQR API
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(bankInfo.content)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  const checkPayment = async () => {
    if (!bookingData?.bookingCode || checking) return;
    
    setChecking(true);
    try {
      // Gọi API backend để check
      const response = await bookingService.checkPaymentStatus(bookingData.bookingCode);
      
      if (response.data.isPaid) {
        // Đã thanh toán
        setStep(2);
        message.success('Thanh toán thành công!');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Check payment error:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const handleTimeout = () => {
    message.error('Hết thời gian thanh toán!');
    onCancel();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={step === 1 ? null : onCancel}
      footer={null}
      width={600}
      closable={step !== 1}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Steps 
          current={step}
          items={[
            { title: 'Xác nhận', icon: <QrcodeOutlined /> },
            { title: 'Thanh toán', icon: <ClockCircleOutlined /> },
            { title: 'Hoàn tất', icon: <CheckCircleOutlined /> }
          ]}
        />

        {/* BƯỚC 1: XÁC NHẬN */}
        {step === 0 && (
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
              <QrcodeOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              <Title level={3}>Xác nhận đặt vé</Title>
              
              <div style={{ textAlign: 'left', width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Mã đặt vé:</Text>
                    <Text>{bookingData?.bookingCode}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Số ghế:</Text>
                    <Text>{bookingData?.seats?.length || 0} ghế</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Tổng tiền:</Text>
                    <Text style={{ fontSize: 20, color: '#ff4d4f', fontWeight: 'bold' }}>
                      {formatCurrency(bankInfo.amount)}
                    </Text>
                  </div>
                </Space>
              </div>
              
              <Button 
                type="primary" 
                size="large" 
                block 
                onClick={() => setStep(1)}
              >
                Tiến hành thanh toán
              </Button>
            </Space>
          </Card>
        )}

        {/* BƯỚC 2: THANH TOÁN */}
        {step === 1 && (
          <>
            {/* Timer */}
            <Card style={{ background: '#fff7e6', borderColor: '#ffa940' }}>
              <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
                <Text strong>⏰ Thời gian còn lại:</Text>
                <Countdown 
                  value={deadline} 
                  format="mm:ss"
                  valueStyle={{ fontSize: 32, color: '#ff4d4f' }}
                  onFinish={handleTimeout}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Vui lòng thanh toán trong thời gian trên
                </Text>
              </Space>
            </Card>

            {/* QR Code */}
            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                <Title level={4}>📱 Quét mã QR để thanh toán</Title>
                <div style={{ 
                  padding: 20, 
                  background: 'white',
                  border: '2px solid #1890ff',
                  borderRadius: 12,
                  display: 'inline-block'
                }}>
                  <img 
                    src={qrUrl} 
                    alt="QR Code" 
                    style={{ width: 280, height: 280, display: 'block' }}
                  />
                </div>
                <Text strong style={{ color: '#1890ff' }}>
                  Mở app ngân hàng và quét mã QR
                </Text>
                {checking && (
                  <Space>
                    <Spin size="small" />
                    <Text type="secondary">Đang kiểm tra thanh toán...</Text>
                  </Space>
                )}
              </Space>
            </Card>

            {/* Thông tin chuyển khoản */}
            <Card 
              title="💳 Thông tin chuyển khoản" 
              size="small"
              style={{ background: '#f0f5ff' }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Ngân hàng:</Text>
                  <Text>{bankInfo.bankId === 'VCB' ? 'Vietcombank' : bankInfo.bankId}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Số tài khoản:</Text>
                  <Text copyable>{bankInfo.accountNumber}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Chủ TK:</Text>
                  <Text>{bankInfo.accountName}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Số tiền:</Text>
                  <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                    {formatCurrency(bankInfo.amount)}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Nội dung:</Text>
                  <Text code copyable style={{ color: '#f5222d' }}>
                    {bankInfo.content}
                  </Text>
                </div>
              </Space>
            </Card>

            {/* Lưu ý quan trọng */}
            <Card 
              size="small" 
              style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
            >
              <Space direction="vertical" size="small">
                <Text strong style={{ color: '#52c41a' }}>⚠️ LƯU Ý QUAN TRỌNG:</Text>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
                  <li>Chuyển khoản <strong>ĐÚNG SỐ TIỀN</strong></li>
                  <li>Ghi <strong>ĐÚNG NỘI DUNG</strong>: <Text code>{bankInfo.content}</Text></li>
                  <li>Hệ thống tự động xác nhận sau khi nhận tiền</li>
                  <li>Không cần chụp bill, hệ thống tự check</li>
                </ul>
              </Space>
            </Card>

            <Button 
              block 
              onClick={checkPayment}
              loading={checking}
            >
              🔄 Kiểm tra thanh toán ngay
            </Button>
          </>
        )}

        {/* BƯỚC 3: HOÀN TẤT */}
        {step === 2 && (
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
              <Title level={3} style={{ color: '#52c41a' }}>
                ✅ Thanh toán thành công!
              </Title>
              <Text>Mã đặt vé: <strong>{bookingData?.bookingCode}</strong></Text>
              <Text type="secondary">
                Vui lòng kiểm tra email hoặc "Vé của tôi"
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Modal>
  );
};

export default PaymentQRModal;