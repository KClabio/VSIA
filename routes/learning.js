const express = require('express');
const router = express.Router();
const path = require('path');

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { requireAuth } = require('../middleware/auth');
const { courseStats } = require('../lib/courseStats');
const { signRawUrl } = require('../middleware/upload');

const OFFICE_PREVIEW_EXTENSIONS = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];

// Trả về cách hiển thị tài liệu ngay trên trang thay vì bắt học viên tải file về:
// PDF trình duyệt tự render qua iframe; các định dạng Office (Word/PPT/Excel) nhúng qua
// Microsoft Office Online Viewer (chỉ hoạt động khi file truy cập được từ Internet, tức là
// khi web đã deploy công khai — không xem trước được lúc chạy trên localhost).
function documentPreview(lesson, req) {
  if (!lesson || lesson.type !== 'document' || !lesson.documentFile) return null;
  const ext = path.extname(lesson.documentFile.split('?')[0]).toLowerCase();
  if (ext === '.pdf') return { kind: 'pdf', url: lesson.documentFile };
  if (OFFICE_PREVIEW_EXTENSIONS.includes(ext)) {
    const absoluteUrl = lesson.documentFile.startsWith('http')
      ? lesson.documentFile
      : `${req.protocol}://${req.get('host')}${lesson.documentFile}`;
    return { kind: 'office', url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}` };
  }
  return { kind: 'other', url: lesson.documentFile };
}

function toYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let embedUrl = null;
    if (parsed.hostname.includes('youtu.be')) {
      embedUrl = `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') embedUrl = `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
      else if (parsed.pathname.startsWith('/embed/')) embedUrl = url;
      else if (parsed.pathname.startsWith('/shorts/')) embedUrl = `https://www.youtube.com/embed/${parsed.pathname.split('/')[2]}`;
    }
    if (!embedUrl) return url;
    // enablejsapi=1 để JS phía trình duyệt bắt được sự kiện video phát xong (qua YouTube IFrame API),
    // dùng cho tính năng tự động đánh dấu hoàn thành bài học.
    const embedParsed = new URL(embedUrl);
    embedParsed.searchParams.set('enablejsapi', '1');
    return embedParsed.toString();
  } catch {
    return url;
  }
}

router.post('/khoa-hoc/:id/dang-ky', requireAuth, async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) return res.status(404).render('404');

  await Enrollment.findOneAndUpdate(
    { user: req.user._id, course: course._id },
    { $setOnInsert: { user: req.user._id, course: course._id, completedLessons: [], enrolledAt: new Date() } },
    { upsert: true },
  );
  res.redirect(`/hoc/${course._id}`);
});

router.get('/hoc/:courseId', requireAuth, async (req, res) => {
  const course = await Course.findById(req.params.courseId).lean().catch(() => null);
  if (!course) return res.status(404).render('404');

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
  if (!enrollment) {
    return res.redirect(`/khoa-hoc/${course._id}`);
  }

  enrollment.lastAccessedAt = new Date();
  await enrollment.save();

  const allLessons = [];
  (course.modules || []).forEach((m) => (m.lessons || []).forEach((l) => allLessons.push(l)));

  let currentLessonId = req.query.bai;
  let currentLesson = currentLessonId
    ? allLessons.find((l) => String(l._id) === currentLessonId)
    : null;
  if (!currentLesson) {
    currentLesson = allLessons.find((l) => !enrollment.completedLessons.includes(String(l._id))) || allLessons[0] || null;
  }
  if (currentLesson && currentLesson.documentFile) {
    currentLesson.documentFile = signRawUrl(currentLesson.documentFile);
  }
  (course.materials || []).forEach((m) => { m.filePath = signRawUrl(m.filePath); });

  const currentEmbedUrl = currentLesson && currentLesson.type === 'video' ? toYoutubeEmbedUrl(currentLesson.videoUrl) : null;
  const stats = courseStats(course, enrollment.completedLessons);

  res.render('course-player', {
    course,
    enrollment,
    currentLesson,
    currentEmbedUrl,
    currentDocumentPreview: documentPreview(currentLesson, req),
    stats,
  });
});

// Đánh dấu hoàn thành tự động (gọi bằng fetch từ JS khi video phát xong / hết thời gian đọc tài
// liệu tối thiểu) — chỉ thêm vào danh sách đã hoàn thành, không toggle, để tránh việc phát lại
// video hoặc mở lại tài liệu vô tình bỏ đánh dấu đã hoàn thành.
router.post('/hoc/:courseId/bai/:lessonId/hoan-thanh', requireAuth, async (req, res) => {
  const course = await Course.findById(req.params.courseId).lean().catch(() => null);
  if (!course) return res.status(404).json({ ok: false });

  const validLessonIds = new Set();
  (course.modules || []).forEach((m) => (m.lessons || []).forEach((l) => validLessonIds.add(String(l._id))));
  if (!validLessonIds.has(req.params.lessonId)) return res.status(404).json({ ok: false });

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.courseId });
  if (!enrollment) return res.status(404).json({ ok: false });

  if (!enrollment.completedLessons.includes(req.params.lessonId)) {
    enrollment.completedLessons.push(req.params.lessonId);
    await enrollment.save();
  }
  res.json({ ok: true });
});

router.post('/hoc/:courseId/bai/:lessonId/toggle', requireAuth, async (req, res) => {
  const course = await Course.findById(req.params.courseId).lean().catch(() => null);
  if (!course) return res.status(404).render('404');

  const validLessonIds = new Set();
  (course.modules || []).forEach((m) => (m.lessons || []).forEach((l) => validLessonIds.add(String(l._id))));
  if (!validLessonIds.has(req.params.lessonId)) return res.status(404).render('404');

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.courseId });
  if (!enrollment) return res.redirect(`/khoa-hoc/${req.params.courseId}`);

  const idx = enrollment.completedLessons.indexOf(req.params.lessonId);
  if (idx === -1) enrollment.completedLessons.push(req.params.lessonId);
  else enrollment.completedLessons.splice(idx, 1);

  await enrollment.save();
  res.redirect(`/hoc/${req.params.courseId}?bai=${req.params.lessonId}`);
});

router.get('/khoa-hoc-cua-toi', requireAuth, async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id }).sort({ lastAccessedAt: -1 }).lean();
  const courseIds = enrollments.map((e) => e.course);
  const courses = await Course.find({ _id: { $in: courseIds } }).lean();
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  const items = enrollments
    .map((e) => {
      const course = courseMap.get(String(e.course));
      if (!course) return null;
      return { enrollment: e, course, stats: courseStats(course, e.completedLessons) };
    })
    .filter(Boolean);

  const completedCount = items.filter((i) => i.stats.total > 0 && i.stats.percent === 100).length;
  const avgPercent = items.length
    ? Math.round(items.reduce((sum, i) => sum + i.stats.percent, 0) / items.length)
    : 0;

  const suggested = await Course.find({ _id: { $nin: courseIds } }).sort({ createdAt: -1 }).limit(3).lean();

  res.render('my-courses', {
    pageTitle: 'Khoá học của tôi',
    active: 'khoa-hoc-cua-toi',
    items,
    suggested,
    summary: { total: items.length, completedCount, avgPercent },
  });
});

router.get('/nhiem-vu-hoc-tap', requireAuth, (req, res) => {
  res.render('learning-placeholder', {
    active: 'nhiem-vu',
    pageTitle: 'Nhiệm vụ học tập',
    message: 'Tính năng theo dõi nhiệm vụ, bài tập được giao đang được phát triển. Vui lòng quay lại sau.',
  });
});

router.get('/ket-qua-hoc-tap', requireAuth, (req, res) => {
  res.render('learning-placeholder', {
    active: 'ket-qua',
    pageTitle: 'Kết quả học tập',
    message: 'Tính năng tổng hợp kết quả, điểm số học tập đang được phát triển. Vui lòng quay lại sau.',
  });
});

module.exports = router;
