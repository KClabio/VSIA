const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Course = require('../models/Course');
const Media = require('../models/Media');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadImage, uploadVideo, uploadCourseFiles } = require('../middleware/upload');

router.use(requireAuth, requireAdmin);

function unlinkUploaded(relativePath) {
  if (!relativePath) return;
  fs.unlink(path.join(__dirname, '..', 'public', relativePath), () => {});
}

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
  };
}

router.get('/', (req, res) => {
  res.render('admin/dashboard');
});

// --- Khoá học ---

router.get('/khoa-hoc', async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  res.render('admin/courses', { courses });
});

router.get('/khoa-hoc/moi', (req, res) => {
  res.render('admin/course-form', { course: null, error: null });
});

router.post('/khoa-hoc/moi', (req, res) => {
  uploadCourseFiles(req, res, async (err) => {
    if (err) {
      return res.render('admin/course-form', { course: null, error: err.message });
    }

    const image = req.files?.image?.[0] ? `/uploads/images/${req.files.image[0].filename}` : null;
    const materials = (req.files?.materials || []).map((f) => ({
      name: f.originalname,
      filePath: `/uploads/documents/${f.filename}`,
    }));

    await Course.create({ ...courseFieldsFromBody(req.body), image, materials });
    res.redirect('/admin/khoa-hoc');
  });
});

router.get('/khoa-hoc/:id/sua', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) return res.status(404).render('404');
  res.render('admin/course-form', { course, error: null });
});

router.post('/khoa-hoc/:id/sua', (req, res) => {
  uploadCourseFiles(req, res, async (err) => {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).render('404');

    if (err) {
      return res.render('admin/course-form', { course: course.toObject(), error: err.message });
    }

    Object.assign(course, courseFieldsFromBody(req.body));

    if (req.files?.image?.[0]) {
      unlinkUploaded(course.image);
      course.image = `/uploads/images/${req.files.image[0].filename}`;
    }

    if (req.files?.materials?.length) {
      course.materials.push(...req.files.materials.map((f) => ({
        name: f.originalname,
        filePath: `/uploads/documents/${f.filename}`,
      })));
    }

    await course.save();
    res.redirect('/admin/khoa-hoc');
  });
});

router.post('/khoa-hoc/:id/xoa', async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (course) {
    unlinkUploaded(course.image);
    course.materials.forEach((m) => unlinkUploaded(m.filePath));
  }
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
    }
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/sua`);
});

// --- Thư viện ảnh/video ---

router.get('/thu-vien', async (req, res) => {
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
  res.render('admin/gallery', { mediaItems, error: null });
});

router.post('/thu-vien/anh', (req, res) => {
  uploadImage.single('image')(req, res, async (err) => {
    const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
    if (err) {
      return res.render('admin/gallery', { mediaItems, error: err.message });
    }
    if (!req.file) {
      return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn ảnh.' });
    }
    await Media.create({
      title: req.body.title || req.file.originalname,
      type: 'image',
      filePath: `/uploads/images/${req.file.filename}`,
    });
    res.redirect('/admin/thu-vien');
  });
});

router.post('/thu-vien/video', (req, res) => {
  uploadVideo.single('video')(req, res, async (err) => {
    const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
    if (err) {
      return res.render('admin/gallery', { mediaItems, error: err.message });
    }
    if (!req.file) {
      return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn video.' });
    }
    await Media.create({
      title: req.body.title || req.file.originalname,
      type: 'video',
      filePath: `/uploads/videos/${req.file.filename}`,
    });
    res.redirect('/admin/thu-vien');
  });
});

router.post('/thu-vien/:id/xoa', async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (media) unlinkUploaded(media.filePath);
  res.redirect('/admin/thu-vien');
});

// --- Người dùng ---

router.get('/nguoi-dung', async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.render('admin/users', { users, error: null });
});

router.post('/nguoi-dung/:id/vai-tro', async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'giaovien'].includes(role)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Vai trò không hợp lệ.' });
  }

  if (req.params.id === String(req.user._id)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Không thể tự đổi vai trò của chính mình.' });
  }

  await User.findByIdAndUpdate(req.params.id, { role });
  res.redirect('/admin/nguoi-dung');
});

module.exports = router;
