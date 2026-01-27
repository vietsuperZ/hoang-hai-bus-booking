import { useState, useEffect } from 'react';
import { Card, Button, Tag, message, Row, Col } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const SeatSelection = ({ totalSeats, bookedSeats = [], onSelectSeats, selectedSeats = [], busType }) => {
  const [seats, setSeats] = useState({ floor1: [], floor2: [] });

  useEffect(() => {
    // Chia đều ghế cho 2 tầng
    const seatsPerFloor = Math.ceil(totalSeats / 2);
    const floor1Seats = [];
    const floor2Seats = [];

    // Tầng 1: A01, A02, A03...
    for (let i = 1; i <= seatsPerFloor; i++) {
      const seatCode = `A${i.toString().padStart(2, '0')}`;
      const bookedSeat = bookedSeats.find(s => s.seatCode === seatCode);
      
      floor1Seats.push({
        code: seatCode,
        isBooked: bookedSeat?.status === 'booked',
        isHolding: bookedSeat?.status === 'holding',
        isSelected: selectedSeats.includes(seatCode),
        available: !bookedSeat || (bookedSeat.status !== 'booked' && bookedSeat.status !== 'holding')
      });
    }

    // Tầng 2: B01, B02, B03...
    for (let i = 1; i <= totalSeats - seatsPerFloor; i++) {
      const seatCode = `B${i.toString().padStart(2, '0')}`;
      const bookedSeat = bookedSeats.find(s => s.seatCode === seatCode);
      
      floor2Seats.push({
        code: seatCode,
        isBooked: bookedSeat?.status === 'booked',
        isHolding: bookedSeat?.status === 'holding',
        isSelected: selectedSeats.includes(seatCode),
        available: !bookedSeat || (bookedSeat.status !== 'booked' && bookedSeat.status !== 'holding')
      });
    }

    setSeats({ floor1: floor1Seats, floor2: floor2Seats });
  }, [totalSeats, bookedSeats, selectedSeats]);

  const handleSeatClick = (seatCode, available) => {
    if (!available) {
      message.warning('Ghế này đã được đặt');
      return;
    }

    const isCurrentlySelected = selectedSeats.includes(seatCode);
    let newSelectedSeats;

    if (isCurrentlySelected) {
      newSelectedSeats = selectedSeats.filter(s => s !== seatCode);
    } else {
      newSelectedSeats = [...selectedSeats, seatCode];
    }

    onSelectSeats(newSelectedSeats);
  };

  const getSeatStyle = (seat) => {
    const baseStyle = {
      width: '80px',
      height: '80px',
      fontSize: '14px',
      fontWeight: 'bold',
      border: '2px solid',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s'
    };

    if (seat.isBooked) {
      return {
        ...baseStyle,
        background: '#ff4d4f',
        borderColor: '#cf1322',
        color: 'white',
        cursor: 'not-allowed',
        opacity: 0.7
      };
    }
    if (seat.isHolding) {
      return {
        ...baseStyle,
        background: '#faad14',
        borderColor: '#d48806',
        color: 'white',
        cursor: 'not-allowed',
        opacity: 0.7
      };
    }
    if (seat.isSelected) {
      return {
        ...baseStyle,
        background: '#52c41a',
        borderColor: '#389e0d',
        color: 'white',
        cursor: 'pointer',
        transform: 'scale(1.05)'
      };
    }
    return {
      ...baseStyle,
      background: 'white',
      borderColor: '#d9d9d9',
      color: '#333',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
  };

  const renderFloor = (floorSeats, columns = 3) => {
    const rows = [];
    for (let i = 0; i < floorSeats.length; i += columns) {
      rows.push(floorSeats.slice(i, i + columns));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {row.map((seat) => (
              <Button
                key={seat.code}
                onClick={() => handleSeatClick(seat.code, seat.available)}
                style={getSeatStyle(seat)}
                disabled={!seat.available}
              >
                <div style={{ fontSize: '16px' }}>{seat.code}</div>
                {seat.isSelected && (
                  <CheckOutlined style={{ fontSize: '12px', marginTop: '4px' }} />
                )}
              </Button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card title="Chọn ghế">
      {/* Chú thích */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            background: 'white', 
            border: '2px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}></div>
          <span>Trống</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            background: '#52c41a', 
            border: '2px solid #389e0d',
            borderRadius: '4px'
          }}></div>
          <span>Đang chọn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            background: '#ff4d4f', 
            border: '2px solid #cf1322',
            borderRadius: '4px',
            opacity: 0.7
          }}></div>
          <span>Đã đặt</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            background: '#faad14', 
            border: '2px solid #d48806',
            borderRadius: '4px',
            opacity: 0.7
          }}></div>
          <span>Đang giữ</span>
        </div>
      </div>

      {/* Sơ đồ xe 2 tầng */}
      <Row gutter={[24, 24]}>
        {/* Tầng 1 */}
        <Col xs={24} md={12}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ 
              textAlign: 'center', 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              🛏️ Tầng 1
            </div>
            {renderFloor(seats.floor1)}
            <div style={{ 
              marginTop: '15px', 
              textAlign: 'right', 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '12px' 
            }}>
              {/* 🚗 Lái xe */}
            </div>
          </div>
        </Col>

        {/* Tầng 2 */}
        <Col xs={24} md={12}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            padding: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ 
              textAlign: 'center', 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              🛏️ Tầng 2
            </div>
            {renderFloor(seats.floor2)}
            <div style={{ 
              marginTop: '15px', 
              textAlign: 'right', 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '12px' 
            }}>
              {/* ⬆️ Tầng trên */}
            </div>
          </div>
        </Col>
      </Row>

      {/* Thông tin ghế đã chọn */}
      {selectedSeats.length > 0 && (
        <div style={{ 
          marginTop: '25px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
             Ghế đã chọn:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedSeats.map(seat => (
              <Tag 
                key={seat} 
                style={{ 
                  margin: 0,
                  fontSize: '14px',
                  padding: '5px 12px',
                  background: 'white',
                  color: '#52c41a',
                  border: '2px solid #52c41a',
                  fontWeight: 'bold'
                }}
              >
                {seat}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SeatSelection;