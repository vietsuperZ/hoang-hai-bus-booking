import { useState } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=10');
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: 30000,
    enabled: true
  });

  // FIX: Check cả false và 0
  const unreadCount = notifications?.filter(n => 
    n.TrangThaiDoc === false || n.TrangThaiDoc === 0
  ).length || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const isUnread = (item) => item.TrangThaiDoc === false || item.TrangThaiDoc === 0;

  const items = [
    {
      key: 'header',
      label: (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <strong style={{ fontSize: '16px' }}>
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </strong>
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsReadMutation.mutate();
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      ),
      disabled: true
    },
    {
      key: 'list',
      label: (
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          width: '350px',
          padding: 0
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  style={{
                    background: isUnread(item) ? '#e6f7ff' : 'white',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onClick={() => {
                    if (isUnread(item)) {
                      markAsReadMutation.mutate(item.MaThongBao);
                    }
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      isUnread(item) && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#1890ff',
                          marginTop: 8
                        }} />
                      )
                    }
                    title={
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: isUnread(item) ? 'bold' : 'normal'
                      }}>
                        {item.NoiDung}
                      </div>
                    }
                    description={
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {dayjs(item.NgayThongBao).fromNow()}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description="Không có thông báo" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '40px 0' }}
            />
          )}
        </div>
      ),
      disabled: true
    }
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: '20px', color: 'white' }} />}
          style={{ color: 'white' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;