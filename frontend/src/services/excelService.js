import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportPassengerList = (trip, tickets) => {
  // Chuẩn bị dữ liệu
  const data = tickets.map((ticket, index) => ({
    'STT': index + 1,
    'Mã vé': ticket.MaVe,
    'Họ tên': ticket.TenHanhKhach,
    'Số điện thoại': ticket.SDT,
    'Số ghế': ticket.MaGhe,
    'Điểm đón': ticket.DiemDonChiTiet || 'Không có',
    'Điểm trả': ticket.DiemTraChiTiet || 'Không có',
    'Giá vé': ticket.GiaVe.toLocaleString('vi-VN') + 'đ',
    'Trạng thái': ticket.TrangThaiVe === 0 ? 'Chưa sử dụng' : ticket.TrangThaiVe === 1 ? 'Đã thanh toán' : 'Đã hủy'
  }));

  // Tạo header thông tin chuyến
  const header = [
    ['DANH SÁCH HÀNH KHÁCH'],
    [],
    [`Tuyến: ${trip.route.diemDi.TenDiaDiem} → ${trip.route.diemDen.TenDiaDiem}`],
    [`Ngày khởi hành: ${new Date(trip.ThoiGianKhoiHanh).toLocaleString('vi-VN')}`],
    [`Biển số xe: ${trip.bus.BienSoXe}`],
    [`Loại xe: ${trip.bus.LoaiXe}`],
    [`Tổng số hành khách: ${tickets.length}`],
    []
  ];

  // Tạo workbook
  const wb = XLSX.utils.book_new();
  
  // Tạo worksheet với header
  const ws = XLSX.utils.aoa_to_sheet(header);
  
  // Thêm dữ liệu hành khách
  XLSX.utils.sheet_add_json(ws, data, { origin: -1 });

  // Định dạng cột
  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 10 }, // Mã vé
    { wch: 25 }, // Họ tên
    { wch: 15 }, // SĐT
    { wch: 10 }, // Số ghế
    { wch: 30 }, // Điểm đón
    { wch: 30 }, // Điểm trả
    { wch: 15 }, // Giá vé
    { wch: 15 }  // Trạng thái
  ];

  // Thêm worksheet vào workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách hành khách');

  // Xuất file
  const fileName = `Danh_sach_hanh_khach_${trip.route.diemDi.TenDiaDiem}_${trip.route.diemDen.TenDiaDiem}_${new Date(trip.ThoiGianKhoiHanh).toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
};