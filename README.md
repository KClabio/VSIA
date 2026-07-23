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

## Cấu trúc

- `config/db.js` — kết nối MongoDB
- `models/` — User, Course (Mongoose)
- `middleware/auth.js` — session auth (`loadUser`, `requireAuth`)
- `routes/` — trang chủ/khoá học (`index.js`), đăng ký/đăng nhập/hồ sơ (`auth.js`)
- `views/` — giao diện EJS
- `public/` — CSS/JS tĩnh
