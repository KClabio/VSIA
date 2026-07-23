const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Media = require('../models/Media');

router.get('/', async (req, res) => {
  const featuredCourses = await Course.find().sort({ createdAt: -1 }).limit(3).lean();
  const galleryItems = await Media.find().sort({ createdAt: -1 }).limit(4).lean();
  res.render('index', { featuredCourses, galleryItems });
});

router.get('/tu-van-phong-lab', (req, res) => {
  res.render('lab-consulting');
});

router.get('/ngay-hoi-cuoc-thi', (req, res) => {
  res.render('stem-events');
});

router.get('/khoa-hoc', async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  res.render('courses', { courses });
});

router.get('/khoa-hoc/:id', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) {
    return res.status(404).render('404');
  }
  res.render('course-detail', { course });
});

module.exports = router;
