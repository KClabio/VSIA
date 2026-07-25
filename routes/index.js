const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Media = require('../models/Media');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const { getPageContent } = require('../lib/pageContent');

router.get('/', async (req, res) => {
  const hero = await getPageContent('home');
  const featuredCourses = await Course.find().sort({ createdAt: -1 }).limit(3).lean();
  const galleryItems = await Media.find().sort({ createdAt: -1 }).limit(4).lean();
  const latestArticles = await Article.find().sort({ createdAt: -1 }).limit(3).lean();
  const teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  const leadershipMembers = teamMembers.filter((m) => m.group === 'leadership');
  const expertMembers = teamMembers.filter((m) => m.group !== 'leadership');
  const partners = await Partner.find().sort({ order: 1, createdAt: 1 }).lean();
  res.render('index', { hero, featuredCourses, galleryItems, latestArticles, leadershipMembers, expertMembers, partners });
});

router.get('/giai-phap', async (req, res) => {
  const hero = await getPageContent('giai-phap');
  const teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  const leadershipMembers = teamMembers.filter((m) => m.group === 'leadership');
  const expertMembers = teamMembers.filter((m) => m.group !== 'leadership');
  const partners = await Partner.find().sort({ order: 1, createdAt: 1 }).lean();
  res.render('solution', { hero, leadershipMembers, expertMembers, partners });
});

router.get('/tu-van-phong-lab', async (req, res) => {
  const hero = await getPageContent('lab-consulting');
  res.render('lab-consulting', { hero });
});

router.get('/ngay-hoi-cuoc-thi', async (req, res) => {
  const hero = await getPageContent('stem-events');
  res.render('stem-events', { hero });
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

router.get('/tin-tuc', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 }).lean();
  res.render('news', { articles });
});

router.get('/tin-tuc/:id', async (req, res) => {
  const article = await Article.findById(req.params.id).lean().catch(() => null);
  if (!article) {
    return res.status(404).render('404');
  }
  res.render('article-detail', { article });
});

router.get('/hinh-anh', async (req, res) => {
  const galleryItems = await Media.find().sort({ createdAt: -1 }).lean();
  res.render('gallery-list', { galleryItems });
});

module.exports = router;
