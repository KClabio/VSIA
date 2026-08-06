require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

const connectDB = require('./config/db');
const { loadUser } = require('./middleware/auth');
const { loadSiteSettings } = require('./lib/settings');
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const learningRoutes = require('./routes/learning');
const widgetRoutes = require('./routes/widgets');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vsia_db';

// Chặn khởi động nếu thiếu biến bắt buộc khi chạy production — tránh trường hợp server "chạy được"
// nhưng session không mã hoá đúng hoặc lỡ trỏ vào MongoDB local không tồn tại trên server thật.
if (process.env.NODE_ENV === 'production') {
  const missing = ['SESSION_SECRET', 'MONGO_URI'].filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ Thiếu biến môi trường bắt buộc khi chạy production: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️ Chưa cấu hình Cloudinary — file upload sẽ lưu trên đĩa cục bộ, có thể mất khi redeploy.');
  }
}

app.set('view engine', 'ejs');
// Chỉ bật khi thật sự đứng sau reverse proxy (Nginx/Vercel/Render...) — nếu bật sai khi không có
// proxy, req.ip có thể bị giả mạo qua header X-Forwarded-For, làm rate limit vô hiệu.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health-check nhẹ, không qua session/DB query nặng — để nền tảng hosting (Render/Railway...)
// tự kiểm tra server còn sống và đã kết nối MongoDB hay chưa.
app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'db_disconnected' });
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'vsia-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    sameSite: 'lax',
  },
}));

app.use(loadUser);
app.use(loadSiteSettings);

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', learningRoutes);
app.use('/', widgetRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).render('500');
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));
