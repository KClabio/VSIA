const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Media = require('../models/Media');
const CourseVideo = require('../models/CourseVideo');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const Enrollment = require('../models/Enrollment');
const { getPageContent } = require('../lib/pageContent');

router.get('/', async (req, res) => {
  const hero = await getPageContent('home');
  const featuredCourses = await Course.find().sort({ createdAt: -1 }).limit(3).lean();
  const galleryItems = await Media.find().sort({ createdAt: -1 }).limit(4).lean();
  const latestArticles = await Article.find({ published: true }).sort({ createdAt: -1 }).limit(8).lean();
  const teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  const leadershipMembers = teamMembers.filter((m) => m.group === 'leadership');
  const expertMembers = teamMembers.filter((m) => m.group !== 'leadership');
  const partners = await Partner.find().sort({ order: 1, createdAt: 1 }).lean();
  res.render('index', { hero, featuredCourses, galleryItems, latestArticles, leadershipMembers, expertMembers, partners });
});

router.get('/giai-phap', async (req, res) => {
  const hero = await getPageContent('giai-phap');
  res.render('solution', { hero });
});

router.get('/tu-van-phong-lab', async (req, res) => {
  const hero = await getPageContent('lab-consulting');
  res.render('lab-consulting', { hero });
});

router.get('/ngay-hoi-cuoc-thi', async (req, res) => {
  const hero = await getPageContent('stem-events');
  res.render('stem-events', { hero });
});

router.get('/lien-he', async (req, res) => {
  const hero = await getPageContent('lien-he');
  res.render('contact', { hero });
});

router.get('/khoa-hoc', async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  const courseVideos = await CourseVideo.find().sort({ featured: -1, order: 1, createdAt: -1 }).lean();
  res.render('courses', { courses, courseVideos });
});

router.get('/khoa-hoc/:id', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) {
    return res.status(404).render('404');
  }
  const enrollment = req.user
    ? await Enrollment.findOne({ user: req.user._id, course: course._id }).lean()
    : null;
  res.render('course-detail', { course, enrollment });
});

router.get('/tin-tuc', async (req, res) => {
  const articles = await Article.find({ published: true }).sort({ createdAt: -1 }).lean();
  res.render('news', { articles });
});

router.get('/tin-tuc/:id', async (req, res) => {
  const article = await Article.findById(req.params.id).lean().catch(() => null);
  if (!article || !article.published) {
    return res.status(404).render('404');
  }
  res.render('article-detail', { article });
});

router.get('/hinh-anh', async (req, res) => {
  const galleryItems = await Media.find().sort({ createdAt: -1 }).lean();
  res.render('gallery-list', { galleryItems });
});

module.exports = router;
