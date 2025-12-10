// TicketDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import bookingService from '../services/bookingService';

const TicketDetail = () => {
  const { id } = useParams();
  const [ticketDetails, setTicketDetails] = useState(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      const response = await bookingService.getTicketDetails(id);
      setTicketDetails(response.data);
    };
    fetchTicketDetails();
  }, [id]);

  if (!ticketDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Chi tiết vé</h2>
      <p>Mã vé: {ticketDetails.MaVe}</p>
      <p>Tên hành khách: {ticketDetails.TenHanhKhach}</p>
      {/* Thêm thông tin chi tiết vé khác ở đây */}
    </div>
  );
};

export default TicketDetail;
