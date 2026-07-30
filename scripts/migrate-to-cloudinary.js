// Chuyển toàn bộ file đã upload (đang nằm trên đĩa cục bộ, đường dẫn /uploads/...) lên
// Cloudinary, và cập nhật lại DB để trỏ tới URL Cloudinary mới. File local KHÔNG bị xoá sau khi
// chuyển — giữ lại làm bản sao lưu, có thể tự dọn public/uploads/ sau khi xác nhận mọi thứ ổn.
//
// Cách dùng:
//   node scripts/migrate-to-cloudinary.js --dry-run   (xem trước sẽ chuyển gì, không đổi gì cả)
//   node scripts/migrate-to-cloudinary.js             (chuyển thật)
//
// Yêu cầu: đã điền CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET trong .env.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const connectDB = require('../config/db');
const { cloudinary, useCloudinary } = require('../middleware/upload');

// Gói Cloudinary free giới hạn ảnh tối đa 10MB/file — ảnh gốc lớn hơn sẽ được nén lại (resize +
// giảm chất lượng JPEG) trước khi tải lên, không đụng tới video/tài liệu.
const MAX_IMAGE_BYTES = 9.5 * 1024 * 1024;

async function compressImageToDataUri(absPath) {
  const buffer = await sharp(absPath)
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

const Course = require('../models/Course');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const Media = require('../models/Media');
const User = require('../models/User');
const SiteSettings = require('../models/SiteSettings');

const DRY_RUN = process.argv.includes('--dry-run');

let migratedCount = 0;
let skippedCount = 0;
let failedCount = 0;

function isLocalPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

async function uploadLocalFile(localPath, resourceType, folder) {
  const absPath = path.join(__dirname, '..', 'public', localPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`không tìm thấy file trên đĩa: ${absPath}`);
  }

  let source = absPath;
  if (resourceType === 'image' && fs.statSync(absPath).size > MAX_IMAGE_BYTES) {
    console.log('    (ảnh vượt 10MB, đang nén lại trước khi tải lên...)');
    source = await compressImageToDataUri(absPath);
  }

  const result = await cloudinary.uploader.upload(source, {
    resource_type: resourceType,
    folder: `vsia/${folder}`,
  });
  return result.secure_url;
}

async function migrateOne(obj, field, resourceType, folder, label) {
  const localPath = obj[field];
  if (!isLocalPath(localPath)) {
    skippedCount += 1;
    return false;
  }

  console.log(`  ${DRY_RUN ? '[DRY RUN] sẽ chuyển' : 'đang chuyển'} ${label}: ${localPath}`);
  if (DRY_RUN) {
    migratedCount += 1;
    return false;
  }

  try {
    obj[field] = await uploadLocalFile(localPath, resourceType, folder);
    migratedCount += 1;
    return true;
  } catch (err) {
    console.error(`    ❌ Lỗi: ${err.message}`);
    failedCount += 1;
    return false;
  }
}

async function migrateCourses() {
  const courses = await Course.find();
  for (const course of courses) {
    let changed = false;
    if (await migrateOne(course, 'image', 'image', 'images', `khoá học "${course.title}" (ảnh đại diện)`)) changed = true;
    for (const material of course.materials) {
      if (await migrateOne(material, 'filePath', 'raw', 'documents', `khoá học "${course.title}" (tài liệu ${material.name})`)) changed = true;
    }
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (await migrateOne(lesson, 'videoFile', 'video', 'videos', `khoá học "${course.title}" (video bài "${lesson.title}")`)) changed = true;
      }
    }
    if (changed) await course.save();
  }
}

async function migrateArticles() {
  const articles = await Article.find();
  for (const article of articles) {
    if (await migrateOne(article, 'image', 'image', 'images', `bài viết "${article.title}"`)) await article.save();
  }
}

async function migrateTeamMembers() {
  const members = await TeamMember.find();
  for (const member of members) {
    if (await migrateOne(member, 'photo', 'image', 'images', `thành viên "${member.name}"`)) await member.save();
  }
}

async function migratePartners() {
  const partners = await Partner.find();
  for (const partner of partners) {
    if (await migrateOne(partner, 'logo', 'image', 'images', `đối tác "${partner.name}"`)) await partner.save();
  }
}

async function migrateMedia() {
  const items = await Media.find();
  for (const item of items) {
    const resourceType = item.type === 'video' ? 'video' : 'image';
    const folder = item.type === 'video' ? 'videos' : 'images';
    if (await migrateOne(item, 'filePath', resourceType, folder, `thư viện "${item.title}"`)) await item.save();
  }
}

async function migrateUsers() {
  const users = await User.find();
  for (const user of users) {
    if (await migrateOne(user, 'avatar', 'image', 'images', `avatar của ${user.name}`)) await user.save();
  }
}

async function migrateSiteSettings() {
  const settings = await SiteSettings.findOne();
  if (!settings) return;
  const fields = [
    ['logo', 'logo trang web'],
    ['heroImage', 'ảnh nền Hero'],
    ['solutionImage', 'ảnh minh hoạ Giải pháp'],
    ['bizLabImage', 'ảnh lĩnh vực - Lab'],
    ['bizTeacherImage', 'ảnh lĩnh vực - Giáo viên'],
    ['bizEventsImage', 'ảnh lĩnh vực - Sự kiện'],
    ['bizRoboticsImage', 'ảnh lĩnh vực - Robotics'],
  ];
  let changed = false;
  for (const [field, label] of fields) {
    if (await migrateOne(settings, field, 'image', 'images', label)) changed = true;
  }
  if (changed) await settings.save();
}

async function main() {
  if (!useCloudinary) {
    console.error('❌ Chưa cấu hình Cloudinary. Điền CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET vào .env trước khi chạy script này.');
    process.exit(1);
  }

  await connectDB();

  console.log(DRY_RUN ? '🔍 Chạy thử (dry-run) — sẽ không thay đổi gì:\n' : '🚀 Bắt đầu chuyển file lên Cloudinary:\n');

  console.log('— Khoá học —');
  await migrateCourses();
  console.log('— Bài viết —');
  await migrateArticles();
  console.log('— Đội ngũ —');
  await migrateTeamMembers();
  console.log('— Đối tác —');
  await migratePartners();
  console.log('— Thư viện ảnh/video —');
  await migrateMedia();
  console.log('— Avatar người dùng —');
  await migrateUsers();
  console.log('— Cài đặt website —');
  await migrateSiteSettings();

  console.log(`\n✅ Hoàn tất. Đã chuyển: ${migratedCount}, bỏ qua (đã là Cloudinary/rỗng): ${skippedCount}, lỗi: ${failedCount}.`);
  if (!DRY_RUN && migratedCount > 0) {
    console.log('File gốc trên đĩa vẫn còn nguyên trong public/uploads/ — có thể tự xoá sau khi xác nhận web hiển thị ảnh đúng.');
  }
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
