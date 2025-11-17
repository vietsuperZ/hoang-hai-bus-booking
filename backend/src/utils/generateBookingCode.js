// Tạo mã booking ngẫu nhiên (VD: HH123456)
const generateBookingCode = () => {
  const prefix = 'HH'; // Hoàng Hải
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 chữ số
  return `${prefix}${randomNum}`;
};

// Kiểm tra mã booking có tồn tại chưa
const generateUniqueBookingCode = async (BookingModel) => {
  let code;
  let exists = true;
  
  while (exists) {
    code = generateBookingCode();
    const booking = await BookingModel.findOne({ where: { MaBooking: code } });
    exists = !!booking;
  }
  
  return code;
};

module.exports = {
  generateBookingCode,
  generateUniqueBookingCode
};