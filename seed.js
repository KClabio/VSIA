require('dotenv').config();
const connectDB = require('./config/db');
const Course = require('./models/Course');

const sampleCourses = [
  {
    title: 'Ứng dụng AI trong giáo dục STEM',
    description: 'Trang bị cho giáo viên kiến thức và công cụ AI để thiết kế bài giảng STEM sinh động, cá nhân hoá theo năng lực học sinh.',
    provider: 'VSIA',
    category: 'STEM',
    isFree: true,
    price: 0,
    rating: 4.5,
  },
  {
    title: 'Mang STEM vào lớp học Robotics',
    description: 'Hướng dẫn giáo viên tổ chức hoạt động Robotics trong lớp học, từ lắp ráp cơ bản đến lập trình điều khiển.',
    provider: 'VSIA',
    category: 'Robotics',
    isFree: true,
    price: 0,
    rating: 5,
  },
  {
    title: 'Thiết kế bài giảng STEM tiểu học',
    description: 'Phương pháp xây dựng chủ đề STEM liên môn phù hợp với học sinh tiểu học, gắn với chương trình giáo dục phổ thông mới.',
    provider: 'VSIA',
    category: 'STEM',
    isFree: true,
    price: 0,
    rating: 4,
  },
  {
    title: 'Hướng dẫn kỹ thuật sử dụng thiết bị phòng STEM',
    description: 'Module hướng dẫn giáo viên và học sinh THCS sử dụng an toàn, hiệu quả các thiết bị trong phòng học STEM.',
    provider: 'VSIA',
    category: 'Kỹ thuật',
    isFree: true,
    price: 0,
    rating: 0,
  },
];

async function seed() {
  await connectDB();
  await Course.deleteMany({});
  await Course.insertMany(sampleCourses);
  console.log(`✅ Đã thêm ${sampleCourses.length} khoá học mẫu.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
