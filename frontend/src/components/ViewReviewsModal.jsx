import { Modal, Rate, List, Empty, Avatar } from 'antd';
import { StarOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import dayjs from 'dayjs';

const ViewReviewsModal = ({ visible, onClose, tripId, tripInfo }) => {
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['trip-reviews', tripId],
    queryFn: async () => {
      const response = await api.get(`/reviews/trip/${tripId}`);
      return response.data;
    },
    enabled: visible && !!tripId
  });

  const reviews = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating || 0;
  const totalReviews = reviewsData?.totalReviews || 0;

  return (
    <Modal
      title={
        <div>
          <StarOutlined style={{ marginRight: 8 }} />
          Đánh giá chuyến xe
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div style={{ padding: '10px 0' }}>
        {/* Thông tin chuyến */}
        {tripInfo && (
          <div style={{ 
            background: '#f5f5f5', 
            padding: 15, 
            borderRadius: 8,
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
              {tripInfo.DiemDi} → {tripInfo.DiemDen}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              {tripInfo.ThoiGianKhoiHanh}
            </div>
          </div>
        )}

        {/* Tổng quan */}
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 0',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 20
        }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#faad14' }}>
            {averageRating.toFixed(1)}
          </div>
          <Rate disabled value={averageRating} style={{ fontSize: 24 }} />
          <div style={{ marginTop: 10, color: '#666' }}>
            {totalReviews} đánh giá
          </div>
        </div>

        {/* Danh sách đánh giá */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            Đang tải...
          </div>
        ) : reviews.length === 0 ? (
          <Empty 
            description="Chưa có đánh giá nào"
            style={{ padding: 40 }}
          />
        ) : (
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>{review.HoTen}</span>
                      <Rate disabled value={review.DiemSo} style={{ fontSize: 14 }} />
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        {review.NoiDung || <span style={{ color: '#999', fontStyle: 'italic' }}>Không có nhận xét</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(review.NgayDanhGia).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        )}
      </div>
    </Modal>
  );
};

export default ViewReviewsModal;