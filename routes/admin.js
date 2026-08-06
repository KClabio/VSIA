const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const Media = require('../models/Media');
const CourseVideo = require('../models/CourseVideo');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const User = require('../models/User');
const { requireAuth, requireStaff, requireModule } = require('../middleware/auth');
const { ROLES } = require('../lib/roles');
const { uploadImage, uploadVideo, uploadCourseFiles, uploadLessonFiles, friendlyUploadError, wrapUpload, fileUrl, signRawUrl } = require('../middleware/upload');
const { computeStats, computeDashboardCards, addClient, removeClient, broadcastStats } = require('../lib/stats');
const { unlinkUploaded } = require('../lib/files');
const { escapeRegExp } = require('../lib/search');
const { getSiteSettings } = require('../lib/settings');
const { getAllPageContents, PAGE_DEFAULTS } = require('../lib/pageContent');
const PageContent = require('../models/PageContent');
const ContactRequest = require('../models/ContactRequest');
const Enrollment = require('../models/Enrollment');
const { courseStats } = require('../lib/courseStats');

router.use(requireAuth, requireStaff);

router.use('/khoa-hoc', requireModule('khoa-hoc'));
router.use('/tien-do', requireModule('tien-do'));
router.use('/thu-vien', requireModule('thu-vien'));
router.use('/video-khoa-hoc', requireModule('video-khoa-hoc'));
router.use('/bai-viet', requireModule('bai-viet'));
router.use('/doi-ngu', requireModule('doi-ngu'));
router.use('/doi-tac', requireModule('doi-tac'));
router.use('/nguoi-dung', requireModule('nguoi-dung'));
router.use('/lien-he', requireModule('lien-he'));
router.use('/cai-dat', requireModule('cai-dat'));

function courseFieldsFromBody(body) {
  const isFree = body.isFree === 'on';
  return {
    title: body.title,
    description: body.description,
    provider: body.provider || 'VSIA',
    category: body.category || 'STEM',
    isFree,
    price: isFree ? 0 : Number(body.price) || 0,
    rating: Number(body.rating) || 0,
    instructor: body.instructor || '',
    instructorUser: body.instructorUser || null,
    courseCode: body.courseCode || '',
    studyPeriod: body.studyPeriod || '',
    examDate: body.examDate || '',
  };
}

router.get('/', async (req, res) => {
  const { cards, showContentChart, stats } = await computeDashboardCards(req.user);
  res.render('admin/dashboard', { active: 'dashboard', cards, showContentChart, stats });
});

router.get('/stats-stream', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).render('403');
  next();
}, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  addClient(res);
  res.write(`data: ${JSON.stringify(await computeStats())}\n\n`);

  req.on('close', () => removeClient(res));
});

// --- Khoá học ---

router.get('/khoa-hoc', async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q ? { title: new RegExp(escapeRegExp(q), 'i') } : {};
  const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
  res.render('admin/courses', { courses, active: 'khoa-hoc', q });
});

router.get('/khoa-hoc/moi', async (req, res) => {
  const teachers = await User.find({ role: 'giaovien' }).select('name').sort({ name: 1 }).lean();
  res.render('admin/course-form', { course: null, error: null, active: 'khoa-hoc', teachers, success: false });
});

router.post('/khoa-hoc/moi', wrapUpload(uploadCourseFiles, async (err, req, res) => {
  if (err) {
    const teachers = await User.find({ role: 'giaovien' }).select('name').sort({ name: 1 }).lean();
    return res.render('admin/course-form', { course: null, error: friendlyUploadError(err), active: 'khoa-hoc', teachers, success: false });
  }

  const image = req.files?.image?.[0] ? fileUrl(req.files.image[0], 'images') : null;
  const materials = (req.files?.materials || []).map((f) => ({
    name: f.originalname,
    filePath: fileUrl(f, 'documents'),
  }));

  await Course.create({ ...courseFieldsFromBody(req.body), image, materials });
  await broadcastStats();
  res.redirect('/admin/khoa-hoc');
}));

router.get('/khoa-hoc/:id/sua', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) return res.status(404).render('404');
  (course.materials || []).forEach((m) => { m.filePath = signRawUrl(m.filePath); });
  const teachers = await User.find({ role: 'giaovien' }).select('name').sort({ name: 1 }).lean();
  res.render('admin/course-form', { course, error: null, active: 'khoa-hoc', teachers, success: req.query.updated === '1' });
});

router.post('/khoa-hoc/:id/sua', wrapUpload(uploadCourseFiles, async (err, req, res) => {
  const course = await Course.findById(req.params.id).catch(() => null);
  if (!course) return res.status(404).render('404');

  if (err) {
    const teachers = await User.find({ role: 'giaovien' }).select('name').sort({ name: 1 }).lean();
    return res.render('admin/course-form', { course: course.toObject(), error: friendlyUploadError(err), active: 'khoa-hoc', teachers, success: false });
  }

  Object.assign(course, courseFieldsFromBody(req.body));

  if (req.files?.image?.[0]) {
    unlinkUploaded(course.image);
    course.image = fileUrl(req.files.image[0], 'images');
  }

  if (req.files?.materials?.length) {
    course.materials.push(...req.files.materials.map((f) => ({
      name: f.originalname,
      filePath: fileUrl(f, 'documents'),
    })));
  }

  await course.save();
  await broadcastStats();
  res.redirect(`/admin/khoa-hoc/${req.params.id}/sua?updated=1`);
}));

router.post('/khoa-hoc/:id/xoa', async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (course) {
    unlinkUploaded(course.image);
    course.materials.forEach((m) => unlinkUploaded(m.filePath));
  }
  await broadcastStats();
  res.redirect('/admin/khoa-hoc');
});

router.post('/khoa-hoc/:id/tai-lieu/:materialId/xoa', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    const material = course.materials.id(req.params.materialId);
    if (material) {
      unlinkUploaded(material.filePath);
      material.deleteOne();
      await course.save();
      await broadcastStats();
    }
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/sua`);
});

// --- Nội dung khoá học (chương/bài học) ---

async function renderCourseContent(res, courseId, error) {
  const course = await Course.findById(courseId).lean().catch(() => null);
  if (!course) return res.status(404).render('404');
  res.render('admin/course-content', { course, error, active: 'khoa-hoc' });
}

router.get('/khoa-hoc/:id/noi-dung', async (req, res) => {
  await renderCourseContent(res, req.params.id, null);
});

function parseTopics(raw) {
  return (raw || '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
}

router.post('/khoa-hoc/:id/noi-dung/chuong', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).render('404');

  if (!req.body.title || !req.body.title.trim()) {
    return renderCourseContent(res, req.params.id, 'Vui lòng nhập tên tuần/chương.');
  }

  course.modules.push({
    title: req.body.title.trim(),
    weekStart: req.body.weekStart ? req.body.weekStart.trim() : '',
    weekEnd: req.body.weekEnd ? req.body.weekEnd.trim() : '',
    chapterTitle: req.body.chapterTitle ? req.body.chapterTitle.trim() : '',
    topics: parseTopics(req.body.topics),
    lessons: [],
  });
  await course.save();
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
});

router.post('/khoa-hoc/:id/noi-dung/chuong/:moduleId/sua', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).render('404');

  const mod = course.modules.id(req.params.moduleId);
  if (mod && req.body.title && req.body.title.trim()) {
    mod.title = req.body.title.trim();
    mod.weekStart = req.body.weekStart ? req.body.weekStart.trim() : '';
    mod.weekEnd = req.body.weekEnd ? req.body.weekEnd.trim() : '';
    mod.chapterTitle = req.body.chapterTitle ? req.body.chapterTitle.trim() : '';
    mod.topics = parseTopics(req.body.topics);
    await course.save();
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
});

router.post('/khoa-hoc/:id/noi-dung/chuong/:moduleId/xoa', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    const mod = course.modules.id(req.params.moduleId);
    if (mod) {
      mod.lessons.forEach((l) => unlinkUploaded(l.videoFile));
      mod.deleteOne();
      await course.save();
    }
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
});

router.post('/khoa-hoc/:id/noi-dung/chuong/:moduleId/bai', wrapUpload(uploadLessonFiles, async (err, req, res) => {
  if (err) return renderCourseContent(res, req.params.id, friendlyUploadError(err));

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).render('404');

  const mod = course.modules.id(req.params.moduleId);
  if (!mod) return renderCourseContent(res, req.params.id, 'Không tìm thấy chương.');

  const videoFile = req.files?.videoFile?.[0];
  const documentFile = req.files?.documentFile?.[0];

  if (!req.body.title || !req.body.title.trim()) {
    if (videoFile) unlinkUploaded(fileUrl(videoFile, 'videos'));
    if (documentFile) unlinkUploaded(fileUrl(documentFile, 'documents'));
    return renderCourseContent(res, req.params.id, 'Vui lòng nhập tên bài học.');
  }

  mod.lessons.push({
    title: req.body.title.trim(),
    type: req.body.type || 'video',
    category: req.body.category || 'lecture',
    videoUrl: req.body.videoUrl ? req.body.videoUrl.trim() : null,
    videoFile: videoFile ? fileUrl(videoFile, 'videos') : null,
    documentFile: documentFile ? fileUrl(documentFile, 'documents') : null,
    documentName: documentFile ? documentFile.originalname : '',
    documentSize: documentFile ? documentFile.size : null,
    content: req.body.content || '',
  });
  await course.save();
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
}));

router.post('/khoa-hoc/:id/noi-dung/chuong/:moduleId/bai/:lessonId/sua', wrapUpload(uploadLessonFiles, async (err, req, res) => {
  if (err) return renderCourseContent(res, req.params.id, friendlyUploadError(err));

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).render('404');

  const mod = course.modules.id(req.params.moduleId);
  const lesson = mod && mod.lessons.id(req.params.lessonId);
  if (!lesson) return renderCourseContent(res, req.params.id, 'Không tìm thấy bài học.');

  const videoFile = req.files?.videoFile?.[0];
  const documentFile = req.files?.documentFile?.[0];

  lesson.title = req.body.title ? req.body.title.trim() : lesson.title;
  lesson.type = req.body.type || lesson.type;
  lesson.category = req.body.category || lesson.category;
  lesson.videoUrl = req.body.videoUrl ? req.body.videoUrl.trim() : null;
  lesson.content = req.body.content || '';
  if (videoFile) {
    unlinkUploaded(lesson.videoFile);
    lesson.videoFile = fileUrl(videoFile, 'videos');
  }
  if (documentFile) {
    unlinkUploaded(lesson.documentFile);
    lesson.documentFile = fileUrl(documentFile, 'documents');
    lesson.documentName = documentFile.originalname;
    lesson.documentSize = documentFile.size;
  }
  await course.save();
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
}));

router.post('/khoa-hoc/:id/noi-dung/chuong/:moduleId/bai/:lessonId/xoa', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    const mod = course.modules.id(req.params.moduleId);
    const lesson = mod && mod.lessons.id(req.params.lessonId);
    if (lesson) {
      unlinkUploaded(lesson.videoFile);
      unlinkUploaded(lesson.documentFile);
      lesson.deleteOne();
      await course.save();
    }
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/noi-dung`);
});

// --- Học viên & tiến độ ---

async function renderCourseStudents(res, courseId, error) {
  const course = await Course.findById(courseId).lean().catch(() => null);
  if (!course) return res.status(404).render('404');

  const enrollments = await Enrollment.find({ course: courseId }).sort({ enrolledAt: -1 }).lean();
  const userIds = enrollments.map((e) => e.user);
  const users = await User.find({ _id: { $in: userIds } }).select('-passwordHash').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const rows = enrollments
    .map((e) => {
      const user = userMap.get(String(e.user));
      if (!user) return null;
      return { enrollment: e, user, stats: courseStats(course, e.completedLessons) };
    })
    .filter(Boolean);

  res.render('admin/course-students', { course, rows, error, active: 'khoa-hoc' });
}

router.get('/khoa-hoc/:id/hoc-vien', async (req, res) => {
  await renderCourseStudents(res, req.params.id, null);
});

router.post('/khoa-hoc/:id/hoc-vien/them', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email) return renderCourseStudents(res, req.params.id, 'Vui lòng nhập email học viên.');

  const user = await User.findOne({ email });
  if (!user) return renderCourseStudents(res, req.params.id, `Không tìm thấy tài khoản với email "${email}". Học viên cần đăng ký tài khoản trước.`);

  await Enrollment.findOneAndUpdate(
    { user: user._id, course: req.params.id },
    { $setOnInsert: { user: user._id, course: req.params.id, completedLessons: [], enrolledAt: new Date() } },
    { upsert: true },
  );
  res.redirect(`/admin/khoa-hoc/${req.params.id}/hoc-vien`);
});

router.post('/khoa-hoc/:id/hoc-vien/:enrollmentId/xoa', async (req, res) => {
  await Enrollment.findOneAndDelete({ _id: req.params.enrollmentId, course: req.params.id });
  res.redirect(`/admin/khoa-hoc/${req.params.id}/hoc-vien`);
});

router.get('/khoa-hoc/:id/hoc-vien/xuat-csv', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) return res.status(404).render('404');

  const enrollments = await Enrollment.find({ course: req.params.id }).sort({ enrolledAt: -1 }).lean();
  const userIds = enrollments.map((e) => e.user);
  const users = await User.find({ _id: { $in: userIds } }).select('-passwordHash').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = [['Họ tên', 'Email', 'Ngày đăng ký', 'Tiến độ (%)', 'Trạng thái'].map(escapeCsv).join(',')];
  enrollments.forEach((e) => {
    const user = userMap.get(String(e.user));
    if (!user) return;
    const stats = courseStats(course, e.completedLessons);
    const status = stats.total > 0 && stats.percent === 100 ? 'Đã hoàn thành' : 'Đang học';
    lines.push([
      user.name,
      user.email,
      new Date(e.enrolledAt).toLocaleDateString('vi-VN'),
      stats.percent,
      status,
    ].map(escapeCsv).join(','));
  });

  const csv = '﻿' + lines.join('\r\n');
  const filename = `hoc-vien-${course.title.replace(/[^a-zA-Z0-9]+/g, '-')}.csv`;
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(csv);
});

router.get('/tien-do', async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  const enrollments = await Enrollment.find().lean();

  const courseMap = new Map(courses.map((c) => [String(c._id), c]));
  const byCourse = new Map();
  enrollments.forEach((e) => {
    const key = String(e.course);
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key).push(e);
  });

  const rows = courses.map((course) => {
    const courseEnrollments = byCourse.get(String(course._id)) || [];
    const stats = courseEnrollments.map((e) => courseStats(course, e.completedLessons));
    const completedCount = stats.filter((s) => s.total > 0 && s.percent === 100).length;
    const avgPercent = stats.length
      ? Math.round(stats.reduce((sum, s) => sum + s.percent, 0) / stats.length)
      : 0;
    return { course, total: courseEnrollments.length, completedCount, avgPercent };
  });

  res.render('admin/progress-overview', { rows, active: 'tien-do' });
});

// --- Thư viện ảnh/video ---

router.get('/thu-vien', async (req, res) => {
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
  res.render('admin/gallery', { mediaItems, error: null });
});

router.post('/thu-vien/anh', wrapUpload(uploadImage.single('image'), async (err, req, res) => {
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
  if (err) {
    return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
  }
  if (!req.file) {
    return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn ảnh.' });
  }
  await Media.create({
    title: req.body.title || req.file.originalname,
    type: 'image',
    filePath: fileUrl(req.file, 'images'),
  });
  await broadcastStats();
  res.redirect('/admin/thu-vien');
}));

router.post('/thu-vien/video', wrapUpload(uploadVideo.single('video'), async (err, req, res) => {
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
  if (err) {
    return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
  }
  if (!req.file) {
    return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn video.' });
  }
  await Media.create({
    title: req.body.title || req.file.originalname,
    type: 'video',
    filePath: fileUrl(req.file, 'videos'),
  });
  await broadcastStats();
  res.redirect('/admin/thu-vien');
}));

router.post('/thu-vien/:id/sua', async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id).catch(() => null);
    if (!media) return res.status(404).render('404');

    const uploader = media.type === 'video' ? uploadVideo.single('file') : uploadImage.single('file');
    uploader(req, res, (err) => {
      (async () => {
        if (err) {
          const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
          return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
        }

        media.title = (req.body.title || media.title).trim() || media.title;
        if (req.file) {
          unlinkUploaded(media.filePath);
          const subfolder = media.type === 'video' ? 'videos' : 'images';
          media.filePath = fileUrl(req.file, subfolder);
        }
        await media.save();
        await broadcastStats();
        res.redirect('/admin/thu-vien');
      })().catch(next);
    });
  } catch (err) {
    next(err);
  }
});

router.post('/thu-vien/:id/xoa', async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (media) unlinkUploaded(media.filePath);
  await broadcastStats();
  res.redirect('/admin/thu-vien');
});

// --- Video bài giảng (trang Khoá học) ---

async function renderCourseVideos(res, error) {
  const videos = await CourseVideo.find().sort({ featured: -1, order: 1, createdAt: -1 }).lean();
  res.render('admin/course-videos', { videos, error, active: 'video-khoa-hoc' });
}

router.get('/video-khoa-hoc', async (req, res) => {
  await renderCourseVideos(res, null);
});

router.post('/video-khoa-hoc', wrapUpload(uploadVideo.single('videoFile'), async (err, req, res) => {
  if (err) return renderCourseVideos(res, friendlyUploadError(err));

  const title = (req.body.title || '').trim();
  const videoLink = (req.body.videoLink || '').trim();
  if (!title) return renderCourseVideos(res, 'Vui lòng nhập tiêu đề video.');
  if (!req.file && !videoLink) return renderCourseVideos(res, 'Vui lòng chọn file video hoặc dán link video (YouTube...).');

  await CourseVideo.create({
    title,
    description: (req.body.description || '').trim(),
    tag: (req.body.tag || '').trim(),
    featured: req.body.featured === 'on',
    videoUrl: req.file ? fileUrl(req.file, 'videos') : videoLink,
    isExternal: !req.file,
  });
  res.redirect('/admin/video-khoa-hoc');
}));

router.post('/video-khoa-hoc/:id/sua', wrapUpload(uploadVideo.single('videoFile'), async (err, req, res) => {
  if (err) return renderCourseVideos(res, friendlyUploadError(err));

  const video = await CourseVideo.findById(req.params.id).catch(() => null);
  if (!video) return res.status(404).render('404');

  const title = (req.body.title || '').trim();
  if (!title) return renderCourseVideos(res, 'Vui lòng nhập tiêu đề video.');

  video.title = title;
  video.description = (req.body.description || '').trim();
  video.tag = (req.body.tag || '').trim();
  video.featured = req.body.featured === 'on';

  const videoLink = (req.body.videoLink || '').trim();
  if (req.file) {
    if (!video.isExternal) unlinkUploaded(video.videoUrl);
    video.videoUrl = fileUrl(req.file, 'videos');
    video.isExternal = false;
  } else if (videoLink) {
    if (!video.isExternal) unlinkUploaded(video.videoUrl);
    video.videoUrl = videoLink;
    video.isExternal = true;
  }

  await video.save();
  res.redirect('/admin/video-khoa-hoc');
}));

router.post('/video-khoa-hoc/:id/xoa', async (req, res) => {
  const video = await CourseVideo.findByIdAndDelete(req.params.id);
  if (video && !video.isExternal) unlinkUploaded(video.videoUrl);
  res.redirect('/admin/video-khoa-hoc');
});

// --- Bài viết ---

function sanitizeSourceUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.get('/bai-viet', async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? { $or: [{ title: new RegExp(escapeRegExp(q), 'i') }, { summary: new RegExp(escapeRegExp(q), 'i') }] }
    : {};
  const articles = await Article.find(filter).sort({ createdAt: -1 }).lean();
  res.render('admin/articles', { articles, active: 'bai-viet', q });
});

router.get('/bai-viet/moi', (req, res) => {
  res.render('admin/article-form', { article: null, error: null, active: 'bai-viet' });
});

router.post('/bai-viet/moi', wrapUpload(uploadImage.single('image'), async (err, req, res) => {
  if (err) {
    return res.render('admin/article-form', { article: null, error: friendlyUploadError(err), active: 'bai-viet' });
  }

  const image = req.file ? fileUrl(req.file, 'images') : null;
  await Article.create({
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    image,
    category: (req.body.category || '').trim(),
    sourceUrl: sanitizeSourceUrl(req.body.sourceUrl),
    published: req.body.published === 'on',
  });
  await broadcastStats();
  res.redirect('/admin/bai-viet');
}));

router.get('/bai-viet/:id/sua', async (req, res) => {
  const article = await Article.findById(req.params.id).lean().catch(() => null);
  if (!article) return res.status(404).render('404');
  res.render('admin/article-form', { article, error: null, active: 'bai-viet' });
});

router.post('/bai-viet/:id/sua', wrapUpload(uploadImage.single('image'), async (err, req, res) => {
  const article = await Article.findById(req.params.id).catch(() => null);
  if (!article) return res.status(404).render('404');

  if (err) {
    return res.render('admin/article-form', { article: article.toObject(), error: friendlyUploadError(err), active: 'bai-viet' });
  }

  article.title = req.body.title;
  article.summary = req.body.summary;
  article.content = req.body.content;
  article.category = (req.body.category || '').trim();
  article.sourceUrl = sanitizeSourceUrl(req.body.sourceUrl);
  article.published = req.body.published === 'on';

  if (req.file) {
    unlinkUploaded(article.image);
    article.image = fileUrl(req.file, 'images');
  }

  await article.save();
  await broadcastStats();
  res.redirect('/admin/bai-viet');
}));

router.post('/bai-viet/:id/xoa', async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (article) unlinkUploaded(article.image);
  await broadcastStats();
  res.redirect('/admin/bai-viet');
});

// --- Đội ngũ (Ban lãnh đạo & Hội đồng chuyên gia) ---

function parseAchievements(raw) {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

router.get('/doi-ngu', async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q ? { name: new RegExp(escapeRegExp(q), 'i') } : {};
  const teamMembers = await TeamMember.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  res.render('admin/team', { teamMembers, active: 'doi-ngu', q });
});

router.get('/doi-ngu/moi', (req, res) => {
  res.render('admin/team-form', { member: null, error: null, active: 'doi-ngu' });
});

router.post('/doi-ngu/moi', wrapUpload(uploadImage.single('photo'), async (err, req, res) => {
  if (err) {
    return res.render('admin/team-form', { member: null, error: friendlyUploadError(err), active: 'doi-ngu' });
  }

  const photo = req.file ? fileUrl(req.file, 'images') : null;
  await TeamMember.create({
    name: req.body.name,
    title: req.body.title,
    group: req.body.group === 'leadership' ? 'leadership' : 'expert',
    bio: req.body.bio || null,
    highlight: req.body.highlight || null,
    achievements: parseAchievements(req.body.achievements),
    order: Number(req.body.order) || 0,
    photo,
  });
  await broadcastStats();
  res.redirect('/admin/doi-ngu');
}));

router.get('/doi-ngu/:id/sua', async (req, res) => {
  const member = await TeamMember.findById(req.params.id).lean().catch(() => null);
  if (!member) return res.status(404).render('404');
  res.render('admin/team-form', { member, error: null, active: 'doi-ngu' });
});

router.post('/doi-ngu/:id/sua', wrapUpload(uploadImage.single('photo'), async (err, req, res) => {
  const member = await TeamMember.findById(req.params.id).catch(() => null);
  if (!member) return res.status(404).render('404');

  if (err) {
    return res.render('admin/team-form', { member: member.toObject(), error: friendlyUploadError(err), active: 'doi-ngu' });
  }

  member.name = req.body.name;
  member.title = req.body.title;
  member.group = req.body.group === 'leadership' ? 'leadership' : 'expert';
  member.bio = req.body.bio || null;
  member.highlight = req.body.highlight || null;
  member.achievements = parseAchievements(req.body.achievements);
  member.order = Number(req.body.order) || 0;

  if (req.file) {
    unlinkUploaded(member.photo);
    member.photo = fileUrl(req.file, 'images');
  }

  await member.save();
  await broadcastStats();
  res.redirect('/admin/doi-ngu');
}));

router.post('/doi-ngu/:id/xoa', async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (member) unlinkUploaded(member.photo);
  await broadcastStats();
  res.redirect('/admin/doi-ngu');
});

// --- Đối tác đồng hành ---

router.get('/doi-tac', async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q ? { name: new RegExp(escapeRegExp(q), 'i') } : {};
  const partners = await Partner.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  res.render('admin/partners', { partners, active: 'doi-tac', q });
});

router.get('/doi-tac/moi', (req, res) => {
  res.render('admin/partner-form', { partner: null, error: null, active: 'doi-tac' });
});

router.post('/doi-tac/moi', wrapUpload(uploadImage.single('logo'), async (err, req, res) => {
  if (err) {
    return res.render('admin/partner-form', { partner: null, error: friendlyUploadError(err), active: 'doi-tac' });
  }

  const logo = req.file ? fileUrl(req.file, 'images') : null;
  await Partner.create({
    name: req.body.name,
    tagline: req.body.tagline || null,
    order: Number(req.body.order) || 0,
    logo,
  });
  await broadcastStats();
  res.redirect('/admin/doi-tac');
}));

router.get('/doi-tac/:id/sua', async (req, res) => {
  const partner = await Partner.findById(req.params.id).lean().catch(() => null);
  if (!partner) return res.status(404).render('404');
  res.render('admin/partner-form', { partner, error: null, active: 'doi-tac' });
});

router.post('/doi-tac/:id/sua', wrapUpload(uploadImage.single('logo'), async (err, req, res) => {
  const partner = await Partner.findById(req.params.id).catch(() => null);
  if (!partner) return res.status(404).render('404');

  if (err) {
    return res.render('admin/partner-form', { partner: partner.toObject(), error: friendlyUploadError(err), active: 'doi-tac' });
  }

  partner.name = req.body.name;
  partner.tagline = req.body.tagline || null;
  partner.order = Number(req.body.order) || 0;

  if (req.file) {
    unlinkUploaded(partner.logo);
    partner.logo = fileUrl(req.file, 'images');
  }

  await partner.save();
  await broadcastStats();
  res.redirect('/admin/doi-tac');
}));

router.post('/doi-tac/:id/xoa', async (req, res) => {
  const partner = await Partner.findByIdAndDelete(req.params.id);
  if (partner) unlinkUploaded(partner.logo);
  await broadcastStats();
  res.redirect('/admin/doi-tac');
});

// --- Người dùng ---

router.get('/nguoi-dung', async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.render('admin/users', { users, error: null });
});

router.post('/nguoi-dung/:id/vai-tro', async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Vai trò không hợp lệ.' });
  }

  if (req.params.id === String(req.user._id)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Không thể tự đổi vai trò của chính mình.' });
  }

  await User.findByIdAndUpdate(req.params.id, { role });
  await broadcastStats();
  res.redirect('/admin/nguoi-dung');
});

// --- Liên hệ tư vấn ---

router.get('/lien-he', async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? {
        $or: [
          { name: new RegExp(escapeRegExp(q), 'i') },
          { contact: new RegExp(escapeRegExp(q), 'i') },
          { message: new RegExp(escapeRegExp(q), 'i') },
        ],
      }
    : {};
  const requests = await ContactRequest.find(filter).sort({ createdAt: -1 }).lean();
  res.render('admin/contacts', { requests, active: 'lien-he', q });
});

router.post('/lien-he/:id/trang-thai', async (req, res) => {
  const current = await ContactRequest.findById(req.params.id);
  if (current) {
    current.status = current.status === 'moi' ? 'da_lien_he' : 'moi';
    await current.save();
  }
  res.redirect('/admin/lien-he');
});

router.post('/lien-he/:id/xoa', async (req, res) => {
  await ContactRequest.findByIdAndDelete(req.params.id);
  res.redirect('/admin/lien-he');
});

// --- Cài đặt (logo trang web, ảnh minh hoạ, nội dung Hero từng trang) ---

async function renderSettings(res, error) {
  const [settings, pages] = await Promise.all([getSiteSettings(), getAllPageContents()]);
  res.render('admin/settings', { settings, pages, error, active: 'cai-dat' });
}

router.get('/cai-dat', async (req, res) => {
  await renderSettings(res, null);
});

router.post('/cai-dat/logo', wrapUpload(uploadImage.single('logo'), async (err, req, res) => {
  if (err) return renderSettings(res, friendlyUploadError(err));

  const settings = await getSiteSettings();
  if (!req.file) return renderSettings(res, 'Vui lòng chọn file logo.');

  unlinkUploaded(settings.logo);
  settings.logo = fileUrl(req.file, 'images');
  await settings.save();
  res.redirect('/admin/cai-dat#logo');
}));

router.post('/cai-dat/logo/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  unlinkUploaded(settings.logo);
  settings.logo = null;
  await settings.save();
  res.redirect('/admin/cai-dat#logo');
});

router.post('/cai-dat/anh-hero', wrapUpload(uploadImage.single('heroImage'), async (err, req, res) => {
  if (err) return renderSettings(res, friendlyUploadError(err));

  const settings = await getSiteSettings();
  if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

  settings.heroImages.push({ url: fileUrl(req.file, 'images') });
  await settings.save();
  res.redirect('/admin/cai-dat#hero-image');
}));

router.post('/cai-dat/anh-hero/:id/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  const item = settings.heroImages.id(req.params.id);
  if (item) {
    unlinkUploaded(item.url);
    item.deleteOne();
    await settings.save();
  }
  res.redirect('/admin/cai-dat#hero-image');
});

router.post('/cai-dat/anh-giai-phap', wrapUpload(uploadImage.single('solutionImage'), async (err, req, res) => {
  if (err) return renderSettings(res, friendlyUploadError(err));

  const settings = await getSiteSettings();
  if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

  unlinkUploaded(settings.solutionImage);
  settings.solutionImage = fileUrl(req.file, 'images');
  await settings.save();
  res.redirect('/admin/cai-dat#solution-image');
}));

router.post('/cai-dat/anh-giai-phap/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  unlinkUploaded(settings.solutionImage);
  settings.solutionImage = null;
  await settings.save();
  res.redirect('/admin/cai-dat#solution-image');
});

router.post('/cai-dat/anh-du-an', wrapUpload(uploadImage.single('projectImage'), async (err, req, res) => {
  if (err) return renderSettings(res, friendlyUploadError(err));

  const settings = await getSiteSettings();
  if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

  settings.projectImages.push({ url: fileUrl(req.file, 'images') });
  await settings.save();
  res.redirect('/admin/cai-dat#project-images');
}));

router.post('/cai-dat/anh-du-an/:id/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  const item = settings.projectImages.id(req.params.id);
  if (item) {
    unlinkUploaded(item.url);
    item.deleteOne();
    await settings.save();
  }
  res.redirect('/admin/cai-dat#project-images');
});

const BIZ_IMAGE_FIELDS = {
  lab: 'bizLabImage',
  teacher: 'bizTeacherImage',
  events: 'bizEventsImage',
  robotics: 'bizRoboticsImage',
  contact: 'contactImage',
  'solution-hero': 'solutionHeroImage',
  'eco-movement': 'ecoMovementImage',
  'eco-equipment': 'ecoEquipmentImage',
  'eco-competition': 'ecoCompetitionImage',
  'eco-training': 'ecoTrainingImage',
};

router.post('/cai-dat/anh-linh-vuc/:key', (req, res, next) => {
  const field = BIZ_IMAGE_FIELDS[req.params.key];
  if (!field) return res.status(404).render('404');

  uploadImage.single('image')(req, res, (err) => {
    (async () => {
      if (err) return renderSettings(res, friendlyUploadError(err));

      const settings = await getSiteSettings();
      if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

      unlinkUploaded(settings[field]);
      settings[field] = fileUrl(req.file, 'images');
      await settings.save();
      res.redirect('/admin/cai-dat#img-' + req.params.key);
    })().catch(next);
  });
});

router.post('/cai-dat/anh-linh-vuc/:key/xoa', async (req, res) => {
  const field = BIZ_IMAGE_FIELDS[req.params.key];
  if (!field) return res.status(404).render('404');

  const settings = await getSiteSettings();
  unlinkUploaded(settings[field]);
  settings[field] = null;
  await settings.save();
  res.redirect('/admin/cai-dat#img-' + req.params.key);
});

router.post('/cai-dat/trang/:pageKey', async (req, res) => {
  if (!PAGE_DEFAULTS[req.params.pageKey]) return res.status(404).render('404');

  await PageContent.findOneAndUpdate(
    { pageKey: req.params.pageKey },
    {
      heroBadge: req.body.heroBadge || '',
      heroTitleLine1: req.body.heroTitleLine1 || '',
      heroTitleLine2: req.body.heroTitleLine2 || '',
      heroSubtitle: req.body.heroSubtitle || '',
      heroCtaText: req.body.heroCtaText || '',
      heroCtaLink: req.body.heroCtaLink || '',
    },
    { upsert: true },
  );
  res.redirect('/admin/cai-dat#hero-' + req.params.pageKey);
});

// --- Tìm kiếm nhanh (thanh admin) ---

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });

  const regex = new RegExp(escapeRegExp(q), 'i');
  const tasks = [];

  if (res.locals.canAccessModule('khoa-hoc')) {
    tasks.push(
      Course.find({ title: regex }).select('title').limit(5).lean()
        .then((items) => items.map((c) => ({ type: 'Khoá học', title: c.title, url: `/admin/khoa-hoc/${c._id}/sua` }))),
    );
  }
  if (res.locals.canAccessModule('bai-viet')) {
    tasks.push(
      Article.find({ title: regex }).select('title').limit(5).lean()
        .then((items) => items.map((a) => ({ type: 'Bài viết', title: a.title, url: `/admin/bai-viet/${a._id}/sua` }))),
    );
  }
  if (res.locals.canAccessModule('video-khoa-hoc')) {
    tasks.push(
      CourseVideo.find({ title: regex }).select('title').limit(5).lean()
        .then((items) => items.map((v) => ({ type: 'Video bài giảng', title: v.title, url: '/admin/video-khoa-hoc' }))),
    );
  }
  if (res.locals.canAccessModule('doi-ngu')) {
    tasks.push(
      TeamMember.find({ name: regex }).select('name').limit(5).lean()
        .then((items) => items.map((m) => ({ type: 'Đội ngũ', title: m.name, url: `/admin/doi-ngu/${m._id}/sua` }))),
    );
  }
  if (res.locals.canAccessModule('doi-tac')) {
    tasks.push(
      Partner.find({ name: regex }).select('name').limit(5).lean()
        .then((items) => items.map((p) => ({ type: 'Đối tác', title: p.name, url: `/admin/doi-tac/${p._id}/sua` }))),
    );
  }

  const grouped = await Promise.all(tasks);
  res.json({ results: grouped.flat() });
});

module.exports = router;
