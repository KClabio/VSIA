# VSIA

Trang web đào tạo giáo viên STEM Việt Nam. Có trang chủ giới thiệu chương trình, danh sách/chi tiết khoá học, đăng ký/đăng nhập.

## Chạy dự án

1. Cài đặt dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` thành `.env` và chỉnh nếu cần (mặc định dùng MongoDB local `mongodb://localhost:27017/vsia_db`).
3. Đảm bảo MongoDB đang chạy, sau đó chèn dữ liệu khoá học mẫu:
   ```
   node seed.js
   ```
4. Chạy server:
   ```
   npm start
   ```
5. Mở [http://localhost:3000](http://localhost:3000).

## Trang quản trị (upload ảnh/video, quản lý khoá học)

1. Đăng ký một tài khoản bình thường trên web.
2. Cấp quyền admin cho tài khoản đó:
   ```
   node scripts/make-admin.js email@cua-ban.com
   ```
3. Đăng nhập lại bằng tài khoản đó — menu sẽ hiện link **Quản trị**, vào `/admin` để:
   - Tạo/sửa/xoá khoá học, upload ảnh đại diện + tài liệu đính kèm (`/admin/khoa-hoc`)
   - Upload ảnh/video cho mục "Hình ảnh hoạt động" ở trang chủ (`/admin/thu-vien`)

File upload được lưu trong `public/uploads/{images,videos,documents}` (không commit vào git, chỉ giữ cấu trúc thư mục qua `.gitkeep`).

## Cấu trúc

- `config/db.js` — kết nối MongoDB
- `models/` — User, Course, Media (Mongoose)
- `middleware/auth.js` — session auth (`loadUser`, `requireAuth`, `requireAdmin`)
- `middleware/upload.js` — cấu hình multer (ảnh/video/tài liệu)
- `routes/` — trang chủ/khoá học (`index.js`), đăng ký/đăng nhập/hồ sơ (`auth.js`), quản trị (`admin.js`)
- `views/` — giao diện EJS (`views/admin/` cho trang quản trị)
- `public/` — CSS/JS tĩnh + file upload
- `scripts/make-admin.js` — cấp quyền admin cho một tài khoản theo email
