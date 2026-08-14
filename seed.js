require('dotenv').config();
const connectDB = require('./config/db');
const Course = require('./models/Course');
const Article = require('./models/Article');
const TeamMember = require('./models/TeamMember');
const Partner = require('./models/Partner');

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

const sampleArticles = [
  {
    title: 'VSIA tổ chức tập huấn giáo viên STEM khu vực miền Bắc',
    summary: 'Hơn 200 giáo viên từ 15 tỉnh thành đã tham gia chương trình tập huấn nâng cao năng lực giảng dạy STEM do VSIA tổ chức.',
    content: 'Hơn 200 giáo viên từ 15 tỉnh thành đã tham gia chương trình tập huấn nâng cao năng lực giảng dạy STEM do VSIA tổ chức.\n\nChương trình diễn ra trong 3 ngày, tập trung vào phương pháp thiết kế bài giảng liên môn, ứng dụng công nghệ trong lớp học và thực hành với thiết bị phòng Lab STEM.',
  },
  {
    title: 'Ra mắt bộ tài liệu STEM tiểu học chuẩn chương trình mới',
    summary: 'Bộ tài liệu gồm 20 chủ đề STEM liên môn, giúp giáo viên tiểu học dễ dàng triển khai theo chương trình giáo dục phổ thông 2018.',
    content: 'Bộ tài liệu gồm 20 chủ đề STEM liên môn, giúp giáo viên tiểu học dễ dàng triển khai theo chương trình giáo dục phổ thông 2018.\n\nTài liệu được biên soạn bởi đội ngũ chuyên gia của VSIA phối hợp cùng các trường đại học sư phạm, đã được thử nghiệm tại nhiều trường tiểu học trên cả nước.',
  },
  {
    title: 'VSIA đồng hành cùng Ngày hội STEM 2026',
    summary: 'Sự kiện quy tụ hàng nghìn học sinh, giáo viên tham gia trải nghiệm các hoạt động khoa học, công nghệ, kỹ thuật và toán học.',
    content: 'Sự kiện quy tụ hàng nghìn học sinh, giáo viên tham gia trải nghiệm các hoạt động khoa học, công nghệ, kỹ thuật và toán học.\n\nNgày hội có sự tham gia của nhiều đối tác giáo dục, doanh nghiệp công nghệ, mang đến không gian trải nghiệm STEM đa dạng cho học sinh mọi lứa tuổi.',
  },
];

const sampleTeamMembers = [
  {
    name: 'TS. Đặng Văn Sơn',
    title: 'Giảng viên Trường ĐH Khoa học Tự nhiên, ĐH Quốc gia HN',
    photo: '/images/team/dang-van-son.jpg',
    order: 0,
  },
  {
    name: 'TS. Dương Tuấn Hưng',
    title: 'Phó Trưởng Phòng Hoá Phân tích, Viện Hoá học, Viện Hàn lâm KH&CN Việt Nam',
    photo: '/images/team/duong-tuan-hung.jpg',
    order: 1,
  },
  {
    name: 'ThS. Hoàng Vân Đông',
    title: 'Giảng viên Khoa Điện tử viễn thông, Trường Đại học Điện lực HN',
    photo: '/images/team/hoang-van-dong.jpg',
    order: 2,
  },
];

const samplePartners = [
  { name: 'Petrovietnam', logo: '/images/partners/petrovietnam.jpg', order: 0 },
  { name: 'VNU University of Science (HUS)', order: 1 },
  { name: 'Học viện Sáng tạo S3', order: 2 },
  { name: 'STEM & Coding', logo: '/images/partners/stem-coding.png', order: 3 },
  { name: 'Teky', logo: '/images/partners/teky.jpg', order: 4 },
  { name: 'CETT', logo: '/images/partners/cett.jpg', order: 5 },
  { name: 'Nexta', logo: '/images/partners/nexta.jpg', order: 6 },
  { name: 'AIG', logo: '/images/partners/aig.jpg', order: 7 },
  { name: 'Robot STEAM Việt Nam', logo: '/images/partners/robot-steam.jpg', order: 8 },
];

async function seed() {
  await connectDB();
  await Course.deleteMany({});
  await Course.insertMany(sampleCourses);
  await Article.deleteMany({});
  await Article.insertMany(sampleArticles);
  await TeamMember.deleteMany({});
  await TeamMember.insertMany(sampleTeamMembers);
  await Partner.deleteMany({});
  await Partner.insertMany(samplePartners);
  console.log(`✅ Đã thêm ${sampleCourses.length} khoá học, ${sampleArticles.length} bài viết, ${sampleTeamMembers.length} thành viên đội ngũ và ${samplePartners.length} đối tác mẫu.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
