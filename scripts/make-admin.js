require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Cách dùng: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`❌ Không tìm thấy user với email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Đã cấp quyền admin cho ${user.name} (${user.email})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
