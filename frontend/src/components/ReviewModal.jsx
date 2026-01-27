import { useState, useEffect } from 'react';
import { Modal, Rate, Input, Button, message } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const { TextArea } = Input;

const ReviewModal = ({ visible, onClose, tripId, tripInfo }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Lấy đánh giá hiện tại (nếu đã đánh giá)
  const { data: existingReview } = useQuery({
    queryKey: ['my-review', tripId],
    queryFn: async () => {
      const response = await api.get(`/reviews/trip/${tripId}/my-review`);
      return response.data;
    },
    enabled: visible && !!tripId
  });

  // Set data nếu đã đánh giá
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.DiemSo);
      setComment(existingReview.NoiDung || '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [existingReview]);

  // Mutation tạo/cập nhật đánh giá
  const reviewMutation = useMutation({
    mutationFn: async (data) => {
      if (existingReview) {
        return await api.put(`/reviews/${existingReview.MaDanhGia}`, data);
      } else {
        return await api.post('/reviews', data);
      }
    },
    onSuccess: () => {
      message.success(existingReview ? 'Cập nhật đánh giá thành công!' : 'Đánh giá thành công!');
      queryClient.invalidateQueries(['my-review', tripId]);
      queryClient.invalidateQueries(['trip-reviews', tripId]);
      onClose();
    },
    onError: (error) => {
      message.error(error?.message || 'Có lỗi xảy ra!');
    }
  });

  // Mutation xóa đánh giá
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/reviews/${existingReview.MaDanhGia}`);
    },
    onSuccess: () => {
      message.success('Xóa đánh giá thành công!');
      queryClient.invalidateQueries(['my-review', tripId]);
      queryClient.invalidateQueries(['trip-reviews', tripId]);
      onClose();
    },
    onError: (error) => {
      message.error(error?.message || 'Có lỗi xảy ra!');
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      message.warning('Vui lòng chọn số sao!');
      return;
    }

    reviewMutation.mutate({
      MaChuyen: tripId,
      DiemSo: rating,
      NoiDung: comment.trim()
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Xác nhận xóa đánh giá?',
      content: 'Bạn có chắc muốn xóa đánh giá này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMutation.mutate();
      }
    });
  };

  return (
    <Modal
      title={
        <div>
          <StarOutlined style={{ marginRight: 8 }} />
          {existingReview ? 'Cập nhật đánh giá' : 'Đánh giá chuyến xe'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      mask={false}
  maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
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

        {/* Đánh giá sao */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, marginBottom: 10 }}>
            Đánh giá của bạn:
          </div>
          <Rate 
            value={rating}
            onChange={setRating}
            style={{ fontSize: 40 }}
          />
          <div style={{ marginTop: 10, color: '#666' }}>
            {rating === 1 && '😞 Rất tệ'}
            {rating === 2 && '😕 Tệ'}
            {rating === 3 && '😐 Tạm được'}
            {rating === 4 && '😊 Tốt'}
            {rating === 5 && '😍 Rất tốt'}
          </div>
        </div>

        {/* Nhận xét */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Nhận xét của bạn:
          </div>
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về chuyến xe này..."
            rows={4}
            maxLength={500}
            showCount
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {existingReview && (
            <Button
              danger
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Xóa đánh giá
            </Button>
          )}
          <Button onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={reviewMutation.isPending}
          >
            {existingReview ? 'Cập nhật' : 'Gửi đánh giá'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;