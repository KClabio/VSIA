const mongoose = require('mongoose');

// Kho nội dung dạng khoá-giá trị cho mọi chữ/ảnh/link hiển thị trên web mà admin sửa được
// trực tiếp trên trang thật (không cần sửa code, không cần thêm field vào schema mỗi lần).
//
// Nguyên tắc quan trọng: giá trị mặc định KHÔNG nằm ở đây mà nằm ngay trong file EJS
// (tham số fallback của txt()/ed()/pic()/lnk()). Nhờ vậy:
//   - Chưa có bản ghi nào trong collection này thì web vẫn hiển thị đúng như cũ.
//   - Xoá một bản ghi = khôi phục về nội dung gốc trong code.
//   - Không bao giờ có tình trạng web trắng trơn vì thiếu dữ liệu trong DB.
const siteContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  kind: { type: String, enum: ['text', 'image', 'link'], default: 'text' },
  // Chuỗi thuần: text là nội dung chữ, image là URL ảnh, link là URL đích.
  // Lưu chuỗi rỗng là có ý nghĩa ("admin muốn để trống"), khác với không có bản ghi
  // ("dùng nội dung mặc định trong code") — xem lib/siteContent.js.
  value: { type: String, default: '' },
  // Ghi lại ai sửa lần cuối để truy vết khi nhiều người cùng biên tập.
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
