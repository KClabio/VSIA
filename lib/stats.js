const Course = require('../models/Course');
const Media = require('../models/Media');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');
const Enrollment = require('../models/Enrollment');

const clients = new Set();

async function computeStats() {
  const [courseCount, teacherCount, adminCount, mediaCount, articleCount, teamCount, partnerCount, courses] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'giaovien' }),
    User.countDocuments({ role: 'admin' }),
    Media.countDocuments(),
    Article.countDocuments(),
    TeamMember.countDocuments(),
    Partner.countDocuments(),
    Course.find().select('materials rating').lean(),
  ]);

  const materialCount = courses.reduce((sum, c) => sum + (c.materials || []).length, 0);
  const avgRating = courses.length
    ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
    : '0.0';

  return { courseCount, teacherCount, adminCount, mediaCount, articleCount, teamCount, partnerCount, materialCount, avgRating };
}

const ADMIN_CARD_META = {
  courseCount: { label: 'Tổng khoá học', icon: '📚', accent: 'blue' },
  teacherCount: { label: 'Giáo viên', icon: '🧑‍🏫', accent: 'green' },
  adminCount: { label: 'Quản trị viên', icon: '🛡️', accent: 'green' },
  mediaCount: { label: 'Ảnh/video thư viện', icon: '🖼', accent: 'amber' },
  articleCount: { label: 'Bài viết', icon: '📰', accent: 'amber' },
  teamCount: { label: 'Thành viên đội ngũ', icon: '👤', accent: 'green' },
  partnerCount: { label: 'Đối tác', icon: '🤝', accent: 'amber' },
  materialCount: { label: 'Tài liệu đính kèm', icon: '📎', accent: 'blue' },
  avgRating: { label: 'Đánh giá trung bình', icon: '⭐', accent: 'amber', suffix: '/5' },
};

async function computeDashboardCards(user) {
  if (user.role === 'giaovien') {
    const courses = await Course.find({ instructorUser: user._id }).select('_id rating').lean();
    const courseIds = courses.map((c) => c._id);
    const studentCount = courseIds.length ? await Enrollment.countDocuments({ course: { $in: courseIds } }) : 0;
    const avgRating = courses.length
      ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
      : '0.0';

    return {
      cards: [
        { key: 'myCourseCount', label: 'Khoá học của tôi', value: courses.length, icon: '📚', accent: 'blue' },
        { key: 'myStudentCount', label: 'Học viên đang học', value: studentCount, icon: '🧑‍🎓', accent: 'green' },
        { key: 'myAvgRating', label: 'Đánh giá trung bình', value: avgRating, icon: '⭐', accent: 'amber', suffix: '/5' },
      ],
      showContentChart: false,
    };
  }

  if (user.role === 'bien_tap') {
    const [articleCount, teamCount, partnerCount, mediaCount] = await Promise.all([
      Article.countDocuments(),
      TeamMember.countDocuments(),
      Partner.countDocuments(),
      Media.countDocuments(),
    ]);

    return {
      cards: [
        { key: 'articleCount', label: 'Bài viết', value: articleCount, icon: '📰', accent: 'amber' },
        { key: 'teamCount', label: 'Thành viên đội ngũ', value: teamCount, icon: '👤', accent: 'green' },
        { key: 'partnerCount', label: 'Đối tác', value: partnerCount, icon: '🤝', accent: 'amber' },
        { key: 'mediaCount', label: 'Ảnh/video thư viện', value: mediaCount, icon: '🖼', accent: 'blue' },
      ],
      showContentChart: false,
    };
  }

  if (user.role === 'cskh') {
    const [newCount, totalCount] = await Promise.all([
      ContactRequest.countDocuments({ status: 'moi' }),
      ContactRequest.countDocuments(),
    ]);

    return {
      cards: [
        { key: 'newContactCount', label: 'Liên hệ mới cần xử lý', value: newCount, icon: '📨', accent: 'red' },
        { key: 'totalContactCount', label: 'Tổng liên hệ đã nhận', value: totalCount, icon: '💬', accent: 'blue' },
      ],
      showContentChart: false,
    };
  }

  const stats = await computeStats();
  const cards = Object.keys(ADMIN_CARD_META).map((key) => ({
    key,
    value: stats[key],
    ...ADMIN_CARD_META[key],
  }));

  return { cards, showContentChart: true, stats };
}

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

async function broadcastStats() {
  if (clients.size === 0) return;
  const stats = await computeStats();
  const payload = `data: ${JSON.stringify(stats)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

module.exports = { computeStats, computeDashboardCards, addClient, removeClient, broadcastStats };
