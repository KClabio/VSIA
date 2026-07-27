const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { requireAuth } = require('../middleware/auth');

function toYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let videoId = null;
    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v');
      else if (parsed.pathname.startsWith('/embed/')) return url;
      else if (parsed.pathname.startsWith('/shorts/')) videoId = parsed.pathname.split('/')[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

function courseStats(course, completedLessons) {
  let total = 0;
  (course.modules || []).forEach((m) => { total += (m.lessons || []).length; });
  const done = (completedLessons || []).filter((id) =>
    (course.modules || []).some((m) => (m.lessons || []).some((l) => String(l._id) === id))
  ).length;
  return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
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

  const currentEmbedUrl = currentLesson && currentLesson.type === 'video' ? toYoutubeEmbedUrl(currentLesson.videoUrl) : null;
  const stats = courseStats(course, enrollment.completedLessons);

  res.render('course-player', {
    course,
    enrollment,
    currentLesson,
    currentEmbedUrl,
    stats,
  });
});

router.post('/hoc/:courseId/bai/:lessonId/toggle', requireAuth, async (req, res) => {
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

  res.render('my-courses', {
    items,
    summary: { total: items.length, completedCount, avgPercent },
  });
});

router.get('/nhiem-vu-hoc-tap', requireAuth, (req, res) => {
  res.render('learning-placeholder', {
    active: 'nhiem-vu',
    title: 'Nhiệm vụ học tập',
    message: 'Tính năng theo dõi nhiệm vụ, bài tập được giao đang được phát triển. Vui lòng quay lại sau.',
  });
});

router.get('/ket-qua-hoc-tap', requireAuth, (req, res) => {
  res.render('learning-placeholder', {
    active: 'ket-qua',
    title: 'Kết quả học tập',
    message: 'Tính năng tổng hợp kết quả, điểm số học tập đang được phát triển. Vui lòng quay lại sau.',
  });
});

module.exports = router;
