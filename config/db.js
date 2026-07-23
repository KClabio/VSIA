const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vsia_db';
  await mongoose.connect(uri);
  console.log('✅ Kết nối MongoDB thành công!');
}

module.exports = connectDB;
